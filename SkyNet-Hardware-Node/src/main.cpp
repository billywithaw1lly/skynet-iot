#include <Arduino.h>
#include <WiFiS3.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <SPI.h>
#include <SD.h>
#include <Adafruit_BMP085.h>
#include <DHT.h>
#include <RTClib.h>

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const char *serverAddress = "your-backend.example.com";
const int serverPort = 443;
const char *stationId = "STN-INDORE-04";
const char *telemetryPath = "/api/telemetry";
const char *setupSsid = "SkyNet_Setup";

constexpr int EEPROM_ADDRESS = 0;
constexpr uint32_t EEPROM_MAGIC = 0x534B594E;
constexpr size_t MAX_WIFI_CREDENTIAL_LENGTH = 64;

struct WifiCredentials
{
  uint32_t magic;
  uint8_t ssidLength;
  uint8_t passwordLength;
  char ssid[MAX_WIFI_CREDENTIAL_LENGTH + 1];
  char password[MAX_WIFI_CREDENTIAL_LENGTH + 1];
};

// ─────────────────────────────────────────────────────────────────────────────
// PIN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
#define DHT_PIN 3
#define DHT_TYPE DHT22 // ← updated to DHT22
#define RAIN_DO_PIN 2
#define MQ135_PIN A3
#define SD_CS_PIN 4

// ─────────────────────────────────────────────────────────────────────────────
// GLOBALS
// ─────────────────────────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BMP085 bmp;
RTC_DS3231 rtc;
WiFiSSLClient client;
WebServer setupServer(80);
WifiCredentials wifiCredentials;
File file;
bool sdAvailable = false;
bool headerWritten = false;
bool bmpAvailable = false;
bool rtcAvailable = false;

bool loadWifiCredentials()
{
  EEPROM.get(EEPROM_ADDRESS, wifiCredentials);

  if (wifiCredentials.magic != EEPROM_MAGIC ||
      wifiCredentials.ssidLength == 0 ||
      wifiCredentials.ssidLength > MAX_WIFI_CREDENTIAL_LENGTH ||
      wifiCredentials.passwordLength > MAX_WIFI_CREDENTIAL_LENGTH)
  {
    return false;
  }

  wifiCredentials.ssid[wifiCredentials.ssidLength] = '\0';
  wifiCredentials.password[wifiCredentials.passwordLength] = '\0';
  return true;
}

void saveWifiCredentials(const String &ssid, const String &password)
{
  wifiCredentials.magic = EEPROM_MAGIC;
  wifiCredentials.ssidLength = ssid.length();
  wifiCredentials.passwordLength = password.length();
  ssid.toCharArray(wifiCredentials.ssid, sizeof(wifiCredentials.ssid));
  password.toCharArray(wifiCredentials.password, sizeof(wifiCredentials.password));
  EEPROM.put(EEPROM_ADDRESS, wifiCredentials);
}

void handleSetupPage()
{
  const char *page = R"HTML(
<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SkyNet Wi-Fi Setup</title></head>
<body><h1>SkyNet Wi-Fi Setup</h1>
<form method="post" action="/save">
<label>SSID<br><input name="ssid" maxlength="64" required></label><br><br>
<label>Password<br><input name="password" type="password" maxlength="64"></label><br><br>
<button type="submit">Save and reboot</button>
</form></body></html>
)HTML";
  setupServer.send(200, "text/html", page);
}

void handleSaveCredentials()
{
  String ssid = setupServer.arg("ssid");
  String password = setupServer.arg("password");

  if (ssid.length() == 0 || ssid.length() > MAX_WIFI_CREDENTIAL_LENGTH ||
      password.length() > MAX_WIFI_CREDENTIAL_LENGTH)
  {
    setupServer.send(400, "text/plain", "SSID and password are too long or empty.");
    return;
  }

  saveWifiCredentials(ssid, password);
  setupServer.send(200, "text/html", "<h1>Saved</h1><p>Rebooting...</p>");
  delay(1000);
  NVIC_SystemReset();
}

void startSetupPortal()
{
  WiFi.disconnect();
  if (WiFi.beginAP(setupSsid) != WL_AP_LISTENING)
  {
    Serial.println("[!!] Failed to start Wi-Fi setup AP");
    while (true)
      delay(1000);
  }

  setupServer.on("/", HTTP_GET, handleSetupPage);
  setupServer.on("/save", HTTP_POST, handleSaveCredentials);
  setupServer.begin();

  Serial.println("[!!] Wi-Fi credentials unavailable");
  Serial.print("[OK] Setup AP: ");
  Serial.println(setupSsid);
  Serial.print("     Open http://");
  Serial.print(WiFi.localIP());
  Serial.println("/ to configure Wi-Fi");

  while (true)
  {
    setupServer.handleClient();
    delay(2);
  }
}

void connectToWifi()
{
  if (!loadWifiCredentials())
  {
    startSetupPortal();
  }

  Serial.print("\nConnecting to WiFi: ");
  Serial.println(wifiCredentials.ssid);
  WiFi.begin(wifiCredentials.ssid, wifiCredentials.password);

  unsigned long connectionStarted = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - connectionStarted < 15000)
  {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("\nWiFi timed out - starting setup AP");
    startSetupPortal();
  }

  Serial.println("\n[OK] WiFi connected!");
  Serial.print("Board IP: ");
  Serial.println(WiFi.localIP());
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
float rawToPPM(int raw)
{
  return map(raw, 0, 4095, 10, 1000);
}

bool readDHT(float &temp, float &humidity)
{
  for (int attempt = 1; attempt <= 5; attempt++)
  {
    temp = dht.readTemperature();
    humidity = dht.readHumidity();
    if (!isnan(temp) && !isnan(humidity))
      return true;
    Serial.print("  DHT22 attempt ");
    Serial.print(attempt);
    Serial.println("/5 failed, retrying in 3s...");
    delay(3000); // ← updated to 3s (DHT22 needs more time)
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// SD HELPERS
// ─────────────────────────────────────────────────────────────────────────────
void initializeSD()
{
  pinMode(10, OUTPUT);
  digitalWrite(10, HIGH);
  pinMode(SD_CS_PIN, OUTPUT);
  digitalWrite(SD_CS_PIN, HIGH);
  delay(200);

  if (SD.begin(SD_CS_PIN))
  {
    Serial.println("[OK] SD card initialized — CSV logging enabled");
    sdAvailable = true;
  }
  else
  {
    Serial.println("[!!] SD card init failed — logging disabled");
    Serial.println("     WiFi transmission will continue normally");
    sdAvailable = false;
  }
}

int openFileToWrite(const char *filename)
{
  file = SD.open(filename, FILE_WRITE);
  return file ? 1 : 0;
}

void writeToFile(String text)
{
  if (file)
    file.println(text);
}

void closeFile()
{
  if (file)
    file.close();
}

void writeEntryToSD(DateTime &now,
                    float temp, float humidity,
                    float pressure, float altitude,
                    float airQuality, int rain)
{
  if (!sdAvailable)
    return;

  bool fileExists = SD.exists("log.csv");

  if (openFileToWrite("log.csv"))
  {
    if (!fileExists)
    {
      writeToFile("date,time,temp_c,humidity_pct,pressure_hpa,altitude_m,air_quality_ppm,rain_pct");
      Serial.println("[SD] Created log.csv with header");
    }

    char dateStr[11];
    sprintf(dateStr, "%04d-%02d-%02d", now.year(), now.month(), now.day());

    char timeStr[9];
    sprintf(timeStr, "%02d:%02d:%02d", now.hour(), now.minute(), now.second());

    String entry = String(dateStr) + "," +
                   String(timeStr) + "," +
                   String(temp, 1) + "," +
                   String(humidity, 1) + "," +
                   String(pressure, 2) + "," +
                   String(altitude, 1) + "," +
                   String((int)airQuality) + "," +
                   String(rain);

    writeToFile(entry);
    closeFile();
    Serial.println("[SD] Entry written to log.csv");
  }
  else
  {
    Serial.println("[SD] Failed to open log.csv for writing");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────
void setup()
{
  analogReadResolution(12);

  Serial.begin(115200);
  delay(3000);

  Serial.println("\n===================================");
  Serial.println("   SkyNet Hardware Node Starting");
  Serial.println("===================================");

  pinMode(RAIN_DO_PIN, INPUT);

  dht.begin();
  delay(3000); // ← updated to 3s
  Serial.println("[OK] DHT22 initialized");

  bmpAvailable = bmp.begin();
  if (!bmpAvailable)
  {
    Serial.println("[!!] BMP180 not found - check SDA/SCL on D18/D19");
  }
  else
  {
    Serial.println("[OK] BMP180 initialized");
  }

  rtcAvailable = rtc.begin();
  if (!rtcAvailable)
  {
    Serial.println("[!!] DS3231 not found - check SDA/SCL on D18/D19");
  }
  else
  {
    if (rtc.lostPower())
    {
      Serial.println("[..] RTC lost power - syncing to compile time");
      // rtc.adjust(DateTime(F(__DATE__), F(__TIME__))); // ← commented out
    }
    Serial.println("[OK] DS3231 RTC initialized");
  }

  initializeSD();

  connectToWifi();
  Serial.println("===================================\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────────────────────────────────────────
void loop()
{
  float temp = 0, humidity = 0;
  if (!readDHT(temp, humidity))
  {
    Serial.println("[!!] DHT22 failed after 5 attempts - check wiring");
    delay(10000);
    return;
  }

  float pressure = 1013.25;
  float altitude = 553.0;
  if (bmpAvailable)
  {
    pressure = bmp.readPressure() / 100.0F;
  }
  else
  {
    Serial.println("[!!] BMP180 read failed - using fallback");
  }

  float airQuality = rawToPPM(analogRead(MQ135_PIN));

  bool isRaining = (digitalRead(RAIN_DO_PIN) == LOW);

  DateTime now = DateTime(F(__DATE__), F(__TIME__));
  if (rtcAvailable)
  {
    now = rtc.now();
  }
  char timeStr[9];
  sprintf(timeStr, "%02d:%02d:%02d", now.hour(), now.minute(), now.second());

  Serial.println("Sensor Readings:");
  Serial.print("  Temp:        ");
  Serial.print(temp);
  Serial.println(" C");
  Serial.print("  Humidity:    ");
  Serial.print(humidity);
  Serial.println(" %");
  Serial.print("  Pressure:    ");
  Serial.print(pressure);
  Serial.println(" hPa");
  Serial.print("  Altitude:    ");
  Serial.print(altitude);
  Serial.println(" m");
  Serial.print("  Air Quality: ");
  Serial.print(airQuality);
  Serial.println(" PPM");
  Serial.print("  Rain:        ");
  Serial.println(isRaining ? "YES - Rain detected" : "NO  - Dry");
  Serial.print("  RTC Time:    ");
  Serial.println(timeStr);

  writeEntryToSD(now, temp, humidity, pressure, altitude, airQuality, isRaining ? 1 : 0);

  StaticJsonDocument<256> doc;
  doc["stationId"] = stationId;
  JsonObject payload = doc.createNestedObject("payload");
  payload["temp"] = round(temp * 10.0) / 10.0;
  payload["humidity"] = round(humidity);
  payload["pressure"] = round(pressure * 10.0) / 10.0;
  payload["altitude"] = round(altitude * 10.0) / 10.0;
  payload["airQuality"] = round(airQuality);
  payload["rain"] = isRaining ? 1 : 0;

  String jsonString;
  serializeJson(doc, jsonString);
  Serial.print("Payload: ");
  Serial.println(jsonString);

  Serial.println("Sending to backend...");
  if (client.connect(serverAddress, serverPort))
  {
    client.print("POST ");
    client.print(telemetryPath);
    client.println(" HTTP/1.1");
    client.print("Host: ");
    client.println(serverAddress);
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(jsonString.length());
    client.println("Connection: close");
    client.println();
    client.println(jsonString);

    int statusCode = -1;
    unsigned long timeout = millis();
    while (client.connected() && millis() - timeout < 5000)
    {
      if (client.available())
      {
        String line = client.readStringUntil('\n');
        if (line.startsWith("HTTP/"))
        {
          statusCode = line.substring(9, 12).toInt();
          Serial.print("  Server: ");
          Serial.println(line);
        }
        timeout = millis();
      }
    }
    client.stop();
    if (statusCode >= 200 && statusCode < 300)
    {
      Serial.println("[OK] Telemetry accepted by backend.\n");
    }
    else
    {
      Serial.print("[!!] Backend rejected or did not confirm telemetry (HTTP ");
      Serial.print(statusCode);
      Serial.println(").\n");
    }
  }
  else
  {
    Serial.print("[!!] Could not establish HTTPS connection to ");
    Serial.print(serverAddress);
    Serial.print(":");
    Serial.println(serverPort);
    Serial.println("     Is the backend running?\n");
  }

  delay(10000); // ← updated to 3s
}