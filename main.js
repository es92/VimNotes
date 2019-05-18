


window.onload = function(){

  var CMD_STR = '47756010111050133225314050746578';

  var user_vim_path = '/home/web_user/data/vimrc'
  
  var $ = document.querySelectorAll.bind(document);

  var files_div = $(".files")[0];

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/vimrc", true);
  xhr.onload = function (e) {
    var vimjs = new VimJS_WW('es-vim.js/web/vim_ww.js');
    vimjs.load(function(start){
      vimjs.load_eventfs(() => {

        var fdb = filedb.load_localstorage(user_vim_path);
        filedb.filenames(fdb).forEach((f) => {
          vimjs.FS.writeFile(f, filedb.contents(fdb, f));
        });

        var initialFile = filedb.filenames(fdb)[0];

        var filesui = make_files(files_div, initialFile, fdb.root);

        filesui.render_files(fdb);

        function open(fname) {
          vimjs.enter_string(CMD_STR + 'e ' + fname + "\n");
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
          filedb.save_localstorage(fdb);
          filesui.render_files(fdb);
        });

        filesui.e.on('delete_folder', (folderuid) => {
          filedb.deleteFolder(fdb, folderuid);
          filedb.save_localstorage(fdb);
          filesui.render_files(fdb);
        });

        filesui.e.on('redraw', () => {
          filesui.render_files(fdb);
        });

        filesui.e.on('change_folder_name', (uid, name) => {
          filedb.changeFolderName(fdb, uid, name);
          filedb.save_localstorage(fdb);
          filesui.render_files(fdb);
        });

        filesui.e.on('move', (fname, folderuid) => {
          filedb.move_file(fdb, fname, folderuid);
          filedb.save_localstorage(fdb);
          filesui.render_files(fdb);

        });

        var canvas = document.getElementsByTagName('canvas')[0];
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
                vimjs.FS.readFile(path, { encoding: 'utf8' }, (c) => { 
                  filedb.writeFile(fdb, path, c);
                  filedb.save_localstorage(fdb);
                  filesui.render_files(fdb);
                })
              });

            }
          });
        });
      });
    }, null, true);
  }
  xhr.send(null);

}
