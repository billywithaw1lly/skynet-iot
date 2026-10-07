#include <Arduino.h>
#include <WiFiS3.h>
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
#include "secrets.h"
const char *ssid = WIFI_SSID;
const char *password = WIFI_PASSWORD;
const char *serverAddress = "MacBook-Air-2.local";
const int serverPort = 8000;

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
WiFiClient client;
File file;
bool sdAvailable = false;
bool headerWritten = false;
bool bmpAvailable = false;
bool rtcAvailable = false;

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

  Serial.print("\nConnecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
    if (++attempts > 40)
    {
      Serial.println("\nWiFi timed out - restarting");
      NVIC_SystemReset();
    }
  }

  Serial.println("\n[OK] WiFi connected!");
  Serial.print("Board IP: ");
  Serial.println(WiFi.localIP());
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
  doc["stationId"] = "STN-INDORE-04";
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
    client.println("POST /api/telemetry HTTP/1.1");
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
    Serial.print("[!!] Could not connect to ");
    Serial.print(serverAddress);
    Serial.print(":");
    Serial.println(serverPort);
    Serial.println("     Is the backend running?\n");
  }

  delay(10000); // ← updated to 3s
}