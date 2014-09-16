var nopt = require("nopt");
var Stream = require("stream").Stream;
var path = require("path");
var fs = require('fs');

var knownOpts = {
	"version": Boolean,
	"remux": Boolean,
	"chapters": ["txt", "ogm", "xml"],
	"input": String,
	"output": String

}
var shortHands = {
	"v" : ["--version"],
	"i" : ["--input"],
	"o" : ["--output"],
	"ch" : ["--chapters"]
}

var parsed = nopt(knownOpts, shortHands, process.argv, 2);
//console.log(parsed);

// for first space
console.log('');


var rpav = require("./");

var mtool = new rpav({
	bin_mediainfo: './bin/mediainfo/MediaInfo.exe',
	bin_mplayer: './bin/mplayer/mplayer.exe',
	bin_mp4box: './bin/GPAC/mp4box.exe',
	bin_mkvmerge: './bin/mkvtoolnix/mkvmerge.exe'
});

if (parsed.version) {
	var pk = require('./package.json');
	console.log(' '+pk.name+': '+pk.version);
	mtool.listTools(function(){
		process.exit(0);
	});
} else if (parsed.help) {
	//usage();
	process.exit(0);
}else if(parsed.remux){
	if(parsed.input && parsed.output){
		if(fs.existsSync(parsed.input)) {
			var mux = path.extname(parsed.input).replace('.','')+' to '+path.extname(parsed.output).replace('.','');

			if(mux=='m4v to mkv' || mux=='mp4 to mkv'){
				mtool.m4v2mkv({
					input: parsed.input,
					output: parsed.output,
					info: function(str){
						process.stderr.write('\033[0G '+str); // \r
					},
					done: function(){
						// Clean stderr line
						var blank = new Array(process.stderr.columns + 1).join(' ');
						process.stderr.write('\033[0G'+blank+'\033[0G'); // \r
						console.log('Done!');
						process.exit(0);
					},
					error: function(str){
						
					}
				});
			}else{
				console.log('Remuxing '+mux+' is not supported yet.');
			}
			
		}else{
			console.log('Input not found.');
		}
	}else{
		console.log('You must define an input and an output.');
	}
}else if (parsed.chapters){
	if(parsed.input){
		if(fs.existsSync(parsed.input)){
			mtool.getInfo(parsed.input, function(err, info) {

				if (err) {
					console.log(err);
				}

				mtool.genChapters({
					template: parsed.chapters+'.txt',
					file_info: info
				}, function(chaps){

					if(chaps){
						if(parsed.output){
							var chout = path.normalize(parsed.output);
							fs.writeFileSync(chout, chaps);
							console.log('Chapter file created at: '+chout);
						}else{
							console.log(chaps);
						}
					}else{
						console.log('The file doesn\'t contain chapters.');
					}

				});

			});
		}else{
			console.log('Input not found.');
		}
	}else{
		console.log('You must define an input and an output.');
	}
}else{
	if(parsed.argv.cooked<1){
		console.log('Action undefined, currenlty working on the man info.');
	}
	
}
