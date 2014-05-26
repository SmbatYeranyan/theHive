# README #

This project uses the Raspberry Pi board for a quad-copter proof of concept. **The Hive** is controlled by WiFi signals and Gyroscope data from an Android Smartphone.
### Technologies Used ###

**Hardware**

* RaspberryPi
* IMU board
* 4x ESC
* 4x Brushless Motors
* Wifi Module
* Nrf24l01 *//Secondary wireless protocol*
* Android Smartphone with Gyroscope *//Use the bare Phone to control Gyro Flight*

**Software**

* Linux Debian (Rasbian)
* Node.js
* TCP *//used to communicate the commands*
* WiringPi
* Pulse Width Modulation
* Android APP created in Titanium


### How does it work? ###

The Raspberry Pi is the core of it all. The pi is running on a Debian Linux dist, therefore the GPIO pins can be controlled from many different servers and languages. In our case were using Node.JS as a proof of concept. the Node server runs on the Linux dist as a process. The Hive is a server application using Node. 
Our application creates a TCP server using Node and starts listening for incoming data. The Android App created in Titanium Alloy, uses the Gyroscope from the device and retrieves its current values. This then becomes the main controller of the Hive. As the phone tilts up, down, left, right it sends TCP data through Wifi to the listening Node server IP. 
The data uses **JSON** protocol.
Here is an example: 
```
{gyro:"-35.334231,23.3423553", controls: "takeOff", value: "extras"}

```
The Node TCP server receives the Data and determines the direction and angle from the gyro variables.

### Direction Logic: ###
Gyro variable from JSON is split by "," calling it Left and Right objects.
Left object would be our -35.334231. The Right object would be our 23.3423553

When the Node server checks these objects it knows the maximum and minimum are **-40 ~ 40**. It knows if Left object is < 0 AND > -40, then it should preform a Forward Event. These events are handled within the Node server and calculated what direction is needed to perform and sends events according to its calculation.

### Engine Logic: ###
The engine Logic is determined by its Pins. The Hive has 4 engines layed out from a 2D angle looking from the top. 
**GPIO**

* Top1Pin *//topLeft engine*
* Top2Pin *//topRightt engine*
* Bot1Pin *//botLeft engine*
* Bot2Pin *//botRight engine*

The engine logic uses a class called ***engines()*** to perform all of the motor controls. The motors are controlled by **PWM(Pulse Width Modulation)** this determines the Speed of the engines. For example a GYRO data of a Left Object using -30. We know that -40 is the max Gyro we want therefore -40 is our 100% thrust. We then calculate -30 / -40 and get our thrust percentage to use in the PWM. This logic gives it the ability to increase and decrease engine thrust by moving the Phone.

**Take Off Example**

```
  this.takeOff = function(value){
    allEngines(0.2);
    setTimeout(function(){
      allEngines(0.8);
    }, 2000);
  }
```

**Early paper model of theHive**
This model demonstrates the design and shape of the Hive. The final result will be done in **Carbon**
![alt tag](http://i.imgur.com/84H0V80.jpg?1)
