scp -r pi@192.168.0.103:/home/pi/zaku/theHive/lib ./lib
scp pi@192.168.0.103:/home/pi/zaku/theHive/app.js app.js
ssh -t pi@192.168.0.103 "
	killall -9 node
	node /home/pi/zaku/theHive/app.js
"