RPAV
=======

Wrapper around many multimedia tools for handling multimedia data.

Overview
--------
Looking forward to create a simple tool to manipulate multimedia files, including transcoding, multiplexing and multiplexing media files, currently under development.


Install
--------

```
# This is under development
npm -g install rpav
npm -g install git://github.com/rodrigopolo/rpav.git
npm -g uninstall rpav
```

Usage
-----

```
# This is under development

# Check version
rpav -v

# remux from MP4/M4V to MKV
rpav -remux -i input.m4v -o output.mkv

# Show chapters to stdout as txt format, ogm and xml are also available
rpav -ch txt -i input.m4v

# Save chapter to a file
rpav -ch xml -i input.m4v -o chap.xml
```


Requirements
------------
* [Mediainfo](http://mediaarea.net/en/MediaInfo/Download)
* [MPlayer](http://www.mplayerhq.hu/design7/dload.html#binaries)
* [MP4Box](http://gpac.wp.mines-telecom.fr/downloads/gpac-nightly-builds/)
* [MKVToolNix](https://www.bunkus.org/videotools/mkvtoolnix/downloads.html)


License
-------

(The MIT License)

Copyright (c) by Rodrigo Polo http://rodrigopolo.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Contact
-------

* GitHub ([rodrigopolo](http://github.com/rodrigopolo/))
* Twitter ([@rodrigopolo](http://twitter.com/rodrigopolo))
