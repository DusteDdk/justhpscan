# justhpscan
![](https://github.com/DusteDdk/justhpscan/blob/main/screen.gif)
redneck networked scanner sharing

#  Installing on Raspberry Pi OS (and other systemd debian based):

``` 
sudo apt-get install hplip image-magick npm git
sudo adduser pi lp

git clone https://github.com/DusteDdk/justhpscan.git

cd justhpscan
npm install

sudo cp justhpscand.service /lib/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable justhpscand
sudo systemctl start justhpscand
```

# Using
Point a browser to http://your-pi-ip:3000/ and press a link.

# Why didn't you do X/features/websockets/UX ?
Because I didn't want to.
