deploy:
	rsync -rv --exclude=.git --exclude=tests --exclude=vagrant --delete-excluded . pi@192.168.0.103:/home/pi/zaku/piecopter