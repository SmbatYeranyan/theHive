deploy:
	rsync -rv --exclude=.git . pi@192.168.0.103:/home/pi/theHive
