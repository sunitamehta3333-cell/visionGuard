/*
  Vision Guard — HM-10 BLE serial output
  ---------------------------------------
  Wire HM-10 to the Arduino like the old HC-05:
    HM-10 VCC -> 5V
    HM-10 GND -> GND
    HM-10 TXD -> Arduino RX
    HM-10 RXD -> Arduino TX (through a voltage divider, same as HC-05)

  The website listens on HM-10's UART service (0xFFE0) and characteristic
  (0xFFE1), and expects ONE PLAIN NUMBER PER LINE — the distance in cm,
  ending with a newline. That's it. No labels, no extra text.

  Use this same sketch structure for both the cane and the glasses unit —
  just wire each one's own HM-10 module and keep the distance calculation
  you already have from the HC-SR04.
*/

#include <SoftwareSerial.h>

const int trigPin = 9;
const int echoPin = 10;

// If HM-10 is wired to different pins, change these to match
SoftwareSerial bleSerial(2, 3); // RX, TX

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  bleSerial.begin(9600); // most HM-10 modules default to 9600 baud
}

long readDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  long distanceCm = duration * 0.034 / 2;
  return distanceCm;
}

void loop() {
  long d = readDistanceCm();

  // Send exactly what the website expects: one number, one newline
  bleSerial.println(d);

  delay(300); // ~3 readings per second — adjust to taste
}
