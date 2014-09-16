### Requirements
------------
* [Mediainfo](http://mediaarea.net/en/MediaInfo/Download)
* [MPlayer](http://www.mplayerhq.hu/design7/dload.html#binaries)
* [MP4Box](http://gpac.wp.mines-telecom.fr/downloads/gpac-nightly-builds/)
* [MKVToolNix](https://www.bunkus.org/videotools/mkvtoolnix/downloads.html)

#### Windows structure
```
bin
|
+---GPAC
|       mp4box.exe
|
+---mediainfo
|       MediaInfo.exe
|
+---mkvtoolnix
|       mkvmerge.exe
|
\---mplayer
        mplayer.exe
```

#### OS X Structure
```
bin
|
+---GPAC
|       MP4Box
|
+---mediainfo
|       mediainfo
|
+---mkvtoolnix
|       mkvmerge
|
\---mplayer
        mplayer
```


Bin location
```
:: Windows
%appdata%\npm\node_modules\rpav\bin

# OS X
/usr/local/lib/node_modules/rpav/bin
```

Temp Config on OS X
```
var mtool = new rpav({
        bin_mediainfo: __dirname+'/bin/mediainfo/mediainfo',
        bin_mplayer: __dirname+'/bin/mplayer/mplayer',
        bin_mp4box: __dirname+'/bin/GPAC/MP4Box',
        bin_mkvmerge: __dirname+'/bin/mkvtoolnix/mkvmerge'
});
```


#### Pack
* [Windows](http://rodrigopolo.com/files/rpav/bin.zip)
* [Max OS X](http://rodrigopolo.com/files/rpav/mac_bin.zip)