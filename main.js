


window.onload = function(){

  var CMD_STR = '47756010111050133225314050746578';

  var user_vim_path = '/home/web_user/data/vimrc'
  
  var $ = document.querySelectorAll.bind(document);

  var files_div = $(".files")[0];
  var network_div = $(".network")[0];

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/vimrc", true);

  xhr.onload = function (e) {
    var vimjs = new VimJS_WW('es-vim.js/web/vim_ww.js');
    vimjs.load(function(start){
      vimjs.load_eventfs(() => {

        //var backend = localstorage_backend.init();
        var backend = dropbox_backend.init();

        filedb.load(user_vim_path, backend).then((fdb) => {

          filedb.filenames(fdb).forEach((f) => {
            vimjs.FS.writeFile(f, filedb.contents(fdb, f));
          });

          var initialFile = filedb.filenames(fdb)[0];

          var filesui = make_files(files_div, initialFile, fdb.root);

          filesui.render_files(fdb);

          function open(fname) {
            vimjs.enter_string(CMD_STR + 'w | e ' + fname + "\n");
          }

          let paste_cb = null;

          function set_paste(str, after) {
            vimjs.FS.writeFile('/home/web_user/data/paste_buffer', str);
            paste_cb = () => {
              vimjs.enter_string(CMD_STR + '| let @@ = join(readfile("/home/web_user/data/paste_buffer"), "\\n")\n');
              if (after != null) {
                after();
              }
            }
          }

          var save_lpq = LPQ.init();
          LPQ.set_on_done(save_lpq, () => {
            network_div.classList.remove('active');
            window.onbeforeunload = null;
          });

          function save_and_render() {
            filesui.render_files(fdb);
            window.onbeforeunload = function() {
              return true;
            }

            network_div.classList.add('active');
            let take_last = true;
            LPQ.add(save_lpq, (done) => {
              filedb.save(fdb, backend).then((rerender) => {
                if (rerender) {
                  filesui.render_files(fdb);
                }
                done();
              });
            }, take_last);
          }

          filesui.e.on('change', (fname) => {
            open(fname);
          });

          filesui.e.on('create_file', (fname, folderuid) => {
            filedb.createFile(fdb, fname, folderuid);
            open(fname);
            filesui.render_files(fdb);
          });

          filesui.e.on('create_folder', (folderuid) => {
            filedb.createFolder(fdb, 'New Folder', folderuid);
            save_and_render();
          });

          filesui.e.on('delete_folder', (folderuid) => {
            filedb.deleteFolder(fdb, folderuid);
            save_and_render();
          });

          filesui.e.on('delete_file', (fname) => {
            if (fname == user_vim_path) {
              return;
            }
            filedb.deleteFile(fdb, fname);
            save_and_render();
          });

          filesui.e.on('redraw', () => {
            filesui.render_files(fdb);
          });

          filesui.e.on('change_folder_name', (uid, name) => {
            filedb.changeFolderName(fdb, uid, name);
            save_and_render();
          });

          filesui.e.on('move_file', (fname, folderuid) => {
            filedb.move_file(fdb, fname, folderuid);
            save_and_render();
          });

          filesui.e.on('move_folder', (fuid, folderuid) => {
            filedb.move_folder(fdb, fuid, folderuid);
            save_and_render();
          });

          var canvas = document.getElementsByTagName('canvas')[0];

          canvas.addEventListener("paste", function(e) {
            e.preventDefault();
            e.stopPropagation();
            let paste = (event.clipboardData || window.clipboardData).getData('text');
            set_paste(paste, () => {
              vimjs.enter_string(CMD_STR + 'echo "copied from clipboard"\n');
              setTimeout(() => {
                vimjs.enter_string(CMD_STR + 'call feedkeys("\\<C-v>")\n');
              }, 500);
            });
          });

          let last_yank = '';

          canvas.addEventListener("copy", function(e) {
            e.clipboardData.setData('text/plain', last_yank);
            vimjs.enter_string(CMD_STR + 'echo "copied to clipboard"\n');
            e.preventDefault();
          });

          let last_scroll = Date.now();
          canvas.addEventListener('wheel', (e) => {
            console.log(e.deltaY, last_scroll);
            if (Date.now() - last_scroll > 20) {
              if (e.deltaY > 0) {
                vimjs.enter_string(CMD_STR + 'call feedkeys("\\<C-e>")\n');
              } else {
                vimjs.enter_string(CMD_STR + 'call feedkeys("\\<C-y>")\n');
              }
            }
            last_scroll = Date.now();
          });

          var vc = new VimCanvas(vimjs, canvas);
          window.vc = vc;

          vimjs.FS.readFile(user_vim_path, { encoding: 'utf8' }, (vimrc) => { 
            var vimrc = vimrc + '\n' + xhr.responseText;
            start({
              initialFile: initialFile, 
              initialPath: '/home/web_user/data',
              vimrc: vimrc,
              oninit: function(finishInit){ 
                finishInit();

                vimjs.ww_bridge.on('eventfs_write', (path) => {
                  if (path === '/home/web_user/data/yank_buffer' ){
                    vimjs.FS.readFile(path, { encoding: 'utf8' }, (c) => { 
                      last_yank = c;
                    });
                  } else if (path === '/home/web_user/data/paste_buffer') {
                    if (paste_cb != null) {
                      let paste_cb1 = paste_cb;
                      paste_cb = null;
                      paste_cb1();
                    }
                  } else {
                    vimjs.FS.readFile(path, { encoding: 'utf8' }, (c) => { 
                      filedb.writeFile(fdb, path, c);
                      save_and_render()
                    })
                  }
                });

              }
            });
          });
        });
      });
    }, null, true);
  }
  xhr.send(null);

}
