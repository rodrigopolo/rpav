var fs = require('fs');
var path = require('path');
var child_quee = require("child_quee");
var Mustache = require('mustache');
var rimraf = require("rimraf");

var format = {
	midate: function(d){
		return (d)?d.replace('UTC ','').replace(' ','T')+'Z':d;
	},
	pad: function(num, size){
		var s = num + "";
		while (s.length < size) s = "0" + s;
		return s;
	},
	msToDuration: function(ms){
		var seconds = ms / 1000;
		var hh = Math.floor(seconds / 3600),
		mm = Math.floor(seconds / 60) % 60,
		ss = Math.floor(seconds) % 60,
		mss = ms % 1000;
		return format.pad(hh,2)+':'+format.pad(mm,2)+':'+format.pad(ss,2)+'.'+format.pad(mss,3);
	}
};

var rpmediatool = function(settings) {
	this.settings = {
		verbose: true,
		bin_mediainfo: 'mediainfo',
		bin_mplayer: 'mplayer',
		bin_mp4box: 'mp4box',
		bin_mkvmerge: 'mkvmerge'
	};
	if(settings){
		this.settings.bin_mediainfo = path.normalize(settings.bin_mediainfo || this.settings.bin_mediainfo);
		this.settings.bin_mplayer = path.normalize(settings.bin_mplayer || this.settings.bin_mplayer);
		this.settings.bin_mp4box = path.normalize(settings.bin_mp4box || this.settings.bin_mp4box);
		this.settings.bin_mkvmerge = path.normalize(settings.bin_mkvmerge || this.settings.bin_mkvmerge);
	}
	this.installed = {
		mediainfo: false,
		mplayer: false,
		mp4box: false,
		mkvmerge: false
	}
	this.checked = false;

};

// Check installed packages
rpmediatool.prototype.checkBin = function(done){
	self = this;
	var match;
	if(!self.checked){

		// New child quee
		var quee = new child_quee();

		// MediaInfo Check
		quee.addTask({
			max_buffer: 1,
			bin: self.settings.bin_mediainfo,
			args: ['--Version'],
			allstd: function(err, stdout, stderr){
				var chkregx = /MediaInfoLib - v([A-Za-z0-9-+\.]+)/m;
				if(match = stdout.match(chkregx)){
					self.installed.mediainfo = match[1];
				}
			}
		});

		// mplayer check
		quee.addTask({
			max_buffer: 1,
			bin: self.settings.bin_mplayer,
			args: ['-version'],
			allstd: function(err, stdout, stderr){
				var chkregx = /MPlayer ([A-Za-z0-9-+\.]+)/m;
				if(match = stdout.match(chkregx)){
					self.installed.mplayer = match[1];
				}
			}
		});

		// mp4box check
		quee.addTask({
			max_buffer: 1,
			bin: self.settings.bin_mp4box,
			args: ['-version'],
			allstd: function(err, stdout, stderr){
				var both = stdout+stderr;
				var chkregx = /MP4Box - GPAC version ([A-Za-z0-9-+\.]+)/m;
				if(match = both.match(chkregx)){
					self.installed.mp4box = match[1];
				}
			}
		});

		// mp4box check
		quee.addTask({
			max_buffer: 1,
			bin: self.settings.bin_mkvmerge,
			args: ['-V'],
			allstd: function(err, stdout, stderr){
				var both = stdout+stderr;
				var chkregx = /mkvmerge v([A-Za-z0-9-+\.]+)/m;
				if(match = both.match(chkregx)){
					self.installed.mkvmerge = match[1];
				}
			}
		});

		quee.done(function(){
			self.checked = true;
			done();
		});

		quee.run();

	}else{
		done();
	}
}

// List multimedia tools checked
rpmediatool.prototype.listTools = function(){
	var self = this;
	self.checkBin(function(){
		console.log('\n Multimedia tools:');
		for(var k in self.installed){
			console.log('  '+k+': '+((self.installed[k])?self.installed[k]:'***MISSING***'));
		}
		console.log('\n');
	});
}

// Get file info
rpmediatool.prototype.getInfo = function(file, done){
	var self = this;
	this.checkBin(function(){
		if(self.installed.mediainfo){
			file = path.normalize(file);
			var quee = new child_quee();
			quee.addTask({
				max_buffer: 1,
				bin: self.settings.bin_mediainfo,
				args: [
					'--Inform=file://'+__dirname+'/media_json.txt'.replace(/\\/g, '/'),
					file
				],
				allstd: function(err, stdout, stderr){
					if(err){
						done(err,null);
					}else{
						self.__parseMediaInfo(file, stdout, done);
					}
				}
			});
			quee.run();
		}else{
			done('MediaInfo not found.',null);
		}
	});
}

// Prevent issues with backslashes
rpmediatool.prototype.__JSONSanitizer = function(str){
	var reg = /"(.|[^"]*)"/gmi;
	var matches = str.match(reg);
	for(var k in matches){
		str = str.replace(matches[k],matches[k].replace(/\\/gmi,'\\\\'));
	}
	return str;
}

// Parse MediaInfo JSON output
rpmediatool.prototype.__parseMediaInfo = function(file, stdout, done){
	var self = this;

	var miout = self.__JSONSanitizer(stdout);

	var video = {};
	video.video_tracks=[];
	video.audio_tracks=[];
	video.image_tracks=[];
	video.subtitles=[];

	var vvt;
	var vat;

	var mi;
	var error = false;

	try {
		mi = JSON.parse(miout);
	}
	catch (e) {
		console.log('MediaInfo error, can\'t parse response.');
		error = true;
		done(e,null);
	}
	if(!error){

		video.bitrate		= mi.General.bitrate;
		video.path			= mi.General.path;
		video.size			= mi.General.size;
		video.duration		= mi.General.duration;

		video.encoded		= format.midate(mi.General.encoded);
		video.tagged		= format.midate(mi.General.tagged);
		video.created		= format.midate(mi.General.created);
		video.modified		= format.midate(mi.General.modified);

		video.video_tracks	= mi.Video;
		video.audio_tracks	= mi.Audio;
		video.image_tracks	= mi.Image || [];
		video.subtitles 	= mi.Subs || [];
		video.menu			= mi.General.menu;

		self.getChapters(file, function(err, res) {
			if (!err) {
				video.chapters = res;
				done(null,video);
			}
		});

	}
}

// Get file chapters
rpmediatool.prototype.getChapters = function(file, done){
	var self = this;
	this.checkBin(function(){
		if(self.installed.mplayer){
			var re = /\nID_CHAPTER_ID\=(\d+)\nID_CHAPTER_\d+_START\=(\d+)\nID_CHAPTER_\d+_END\=(\d+)\nID_CHAPTER_\d+_NAME\=(.*)/gmi;
			var chapters = [];
			file = path.normalize(file);
			var quee = new child_quee();
			quee.addTask({
				max_buffer: 1,
				bin: self.settings.bin_mplayer,
				args: [
					file,
					'-identify',
					'-novideo',
					'-nosound'
				],
				allstd: function(err, stdout, stderr){
					if(err){
						done(err,null);
					}else{
						var m;
						while ((m = re.exec(stdout)) != null) {
							if (m.index === re.lastIndex) {
								re.lastIndex++;
							}
							chapters.push({
								start_str: format.msToDuration(m[2]),
								stop_str: format.msToDuration(m[3]),
								num: parseInt(m[1])+1,
								num_str: format.pad(parseInt(m[1])+1,2),
								start: parseInt(m[2]),
								stop: parseInt(m[3]),
								name: m[4].trim()
							});
						}
						done(null,chapters);
					}
				}
			});
			quee.run();
		}else{
			done(null,[]);
		}
	});
}

// Create a chapter string
rpmediatool.prototype.genChapters = function(op, done){
	var template = fs.readFileSync(__dirname + '/../templates/'+op.template, {encoding:'utf8'});;
	done(Mustache.render(template, op.file_info));
}

// Mux MP4/M4V to MKV track by track
rpmediatool.prototype.m4v2mkv = function(op){
	var self = this;
	self.getInfo(op.input, function(err, info) {


		if (err) {
			op.error(err);
		}else{
			self.genChapters({
				template: 'xml.txt',
				file_info: info
			}, function(chaps){

				// Generate file paths
				var paths = {}

				op.input = path.normalize(op.input);
				paths.dest = path.normalize(op.output);
				paths.parent = path.dirname(paths.dest);
				paths.ext = path.extname(paths.dest);
				paths.base = path.basename(paths.dest,paths.ext);
				paths.temp = path.join(paths.parent,paths.base);
				paths.chaps = path.join(paths.temp, 'chaps.xml');

				// Create temporal dir
				if (!fs.existsSync(paths.temp)) {
					fs.mkdirSync(paths.temp);
				}

				// Create chapter file
				if(chaps){
					fs.writeFileSync(paths.chaps, chaps);
				}

				// mp4demux
				m4vdemux = [];
				mkvmux = [];

				// Track counter and order
				var track_counter=0;
				var track_order_arr=[];

				info.video_tracks.forEach(function(vt){


					var fps = vt.fps;
					if(vt.fps==23.976){
						fps = '24000/1001';
					}else if(vt.fps==29.97){
						fps = '30000/1001';
					}else if(vt.fps==59.94){
						fps = '60000/1001';
					}

					var fext = vt.codec;
					if(vt.codec=='AVC'){
						fext = 'h264';
					}

					var track = path.normalize(paths.temp+'/t'+vt.track_id+'.'+fext);

					m4vdemux.push([
						'-raw',
						vt.track_id,
						op.input,
						'-out',
						track
					]);

					mkvmux.push([
						'--forced-track',
						'0:no',
						'--default-duration',
						'0:'+fps+'p',
						'--video-tracks',
						'0',
						'--no-audio',
						'--no-subtitles',
						'--no-track-tags',
						'--no-global-tags',
						'--no-chapters',
						track
					]);

					track_counter++;

				});

				info.audio_tracks.forEach(function(vt){

					var track = path.normalize(paths.temp+'/t'+vt.track_id+'.'+vt.codec.replace(/ (.*)/g, '').toLowerCase());

					m4vdemux.push([
						'-raw',
						vt.track_id,
						op.input,
						'-out',
						track
					]);

					mkvmux.push([
						(vt.lang)?'--language':'',
						(vt.lang)?'0:'+vt.lang:'',
						'--forced-track',
						'0:no',
						'--audio-tracks',
						'0',
						'--no-video',
						'--no-subtitles',
						'--no-track-tags',
						'--no-global-tags',
						'--no-chapters',
						track
					]);

					track_counter++;
				});

				info.subtitles.forEach(function(vt){

					var track = path.normalize(paths.temp+'/t'+vt.track_id);

					m4vdemux.push([
						'-ttxt',
						vt.track_id,
						op.input,
						'-out',
						track+'.ttxt'
					]);

					m4vdemux.push([
						'-srt',
						track+'.ttxt',
						'-out',
						track+'.srt'
					]);

					mkvmux.push([
						'--sub-charset',
						'0:UTF-8',
						(vt.lang)?'--language':'',
						(vt.lang)?'0:'+vt.lang:'',
						'--forced-track',
						'0:no',
						'--subtitle-tracks',
						'0',
						'--no-video',
						'--no-audio',
						'--no-track-tags',
						'--no-global-tags',
						'--no-chapters',
						track+'.srt'
					]);

					track_counter++;
				});


				// MKV Tracks
				for(var i=0; i<track_counter; i++){
					track_order_arr.push(i+':0');
				}

				// MKV Arguments
				var mkvmx = [
					'--output',
					paths.dest
				];

				// Join arguments for MKV
				mkvmux.forEach(function(scm){
					scm.forEach(function(mc){
						mkvmx.push(mc);
					});
				});

				// Track order for MKV
				mkvmx.push('--track-order');
				mkvmx.push(track_order_arr.join(','));

				// Chapters for MKV
				if(chaps){
					mkvmx.push('--chapters');
					mkvmx.push(paths.chaps);
				}

				// New quee
				var quee = new child_quee();

				// Verbose function to report progress
				var reporter = function(task, perc){
					if(op.info){
						var currtsk = task+1;
						var currper = parseFloat(perc);
						var overall = ((task/quee.tasks.length)+((perc/100)/quee.tasks.length))*100;
						op.info('Completed '+currper+'% on task ('+currtsk+' of '+quee.tasks.length+') - Overall progress: '+overall.toFixed(2)+'%');
					}
				}

				// Quee all mp4box track to demux
				for(var i=0; i<m4vdemux.length; i++){
					(function(index) {
						quee.addTask({
							stream: true,
							bin: self.settings.bin_mp4box,
							args: m4vdemux[i],
							stdout: function(str){
								// nothing
							},
							stderr: function(str, tindx){
								var perc = /\((\d+)\//gmi.exec(str);
								if(perc){
									reporter(tindx,perc[1]);
								}
							},
							close: function(code){
								// nothing
							}
						});
					})(i);
				}

				quee.addTask({
					stream: true,
					bin: self.settings.bin_mkvmerge,
					args: mkvmx,
					stdout: function(str, tindx){
						var perc = /Progress: (\d+)\%/gmi.exec(str);
						if(perc){
							reporter(tindx,perc[1]);
						}
					},
					stderr: function(str, tindx){
						// nothing
					},
					close: function(code){
						// nothing
					}
				});

				quee.done(function(){
					// Remove temp folder
					rimraf.sync(paths.temp);

					if(op.done){
						op.done(true);
					}

				});

				// Start quee
				quee.run();


			});
		}

	});
}

// Exports
module.exports = rpmediatool;
