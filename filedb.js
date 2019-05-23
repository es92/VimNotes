

var dropbox_backend = {
  init() {
    var dbx = new Dropbox.Dropbox({ accessToken: localStorage.accessToken });

    var buffer = 'test_buf';

    var path = '/fdb.db';

    //dbx.filesUpload({path: path, contents: buffer})
    //  .then(function (response) {
    //      dbx.filesListFolder({path: ''})
    //      .then(function(response) {
    //          console.log(response);
    //          })
    //      .catch(function(error) {
    //          console.log(error);
    //          });
    //      })
    //.catch(function (error) {
    //    console.error('dropbox error', error)
    //    })



    return {
      save(fdb) {
        return new Promise((resolve) => {
          console.log('save');

        });
      },
      load(default_fdb) {
        return new Promise((resolve) => {
          dbx.filesDownload({path: path})
          .then(function(response) {
            var blob = response.fileBlob;
            var reader = new FileReader();
            reader.addEventListener("loadend", function() {
              console.log(reader.result);
              var buf = Array.from(new Uint8Array(reader.result));
              var string = buf.map((c) => String.fromCharCode(c)).join('')
              try {
                resolve(JSON.parse(string));
              } catch {
                resolve(null);
              }
            });
            reader.readAsArrayBuffer(blob);
          })
          .catch(function(error) {
            console.log(error);
            resolve(null);
          });


        }).then((file) => {
          if (file != null) {
            return file;
          } else {
            return default_fdb;
          }
        });
      },
    }
  }

}

var localstorage_backend = {
  init() {
    return {
      save(fdb) {
        return new Promise((resolve) => {
          localStorage.fdb = JSON.stringify(fdb);
          resolve();
        });
      },
      load(default_fdb) {
        return new Promise((resolve) => {
          let fdb = localStorage.fdb || JSON.stringify(default_fdb);
          fdb = JSON.parse(fdb);
          resolve(fdb);
          return fdb;
        });
      },
    }
  }
}

var filedb = {
  load(user_vim_path, backend) {

    var root_folderuid = Math.random()
    var default_files = {
      '/home/web_user/data/welcome': { contents: 'welcome!', parent: root_folderuid, last_edit: Date.now() },
    }
    default_files[user_vim_path] = { contents: '"vimrc', parent: root_folderuid, last_edit: Date.now() - 1 }

    var default_folders = {};
    default_folders[root_folderuid] = { name: null, parent: null, last_edit: Date.now() };

    var default_fdb = {
      files: default_files,
      folders: default_folders,
      root: root_folderuid,
    }

    return backend.load(default_fdb);
  },

  save(fdb, backend) {
    return backend.save(fdb);
  },

  filenames(fdb) {
    var files = Object.keys(fdb.files);
    files.sort((a, b) => {
      return fdb.files[b].last_edit - fdb.files[a].last_edit;
    });
    return files;
  },

  foldercontents(fdb, folderuid) {
    var folders = Object.keys(fdb.folders).filter((fname) => fdb.folders[fname].parent == folderuid);
    var files = Object.keys(fdb.files).filter((fname) => fdb.files[fname].parent == folderuid);

    return files.map((f) => ({ type: 'file', uid: f })).concat(folders.map((f) => ({ type: 'folder', uid: f })));
  },

  foldernames(fdb) {
    var folders = Object.keys(fdb.folders);
    folders.sort((a, b) => {
      return fdb.folders[b].last_edit - fdb.folders[a].last_edit;
    });
    return folders;
  },

  contents(fdb, fname) {
    return fdb.files[fname].contents;
  },

  foldername(fdb, uid) {
    return fdb.folders[uid].name;
  },

  parentfolder(fdb, fname) {
    return fdb.files[fname].parent;
  },

  writeFile(fdb, fname, contents) {
    fdb.files[fname].contents = contents;
    fdb.files[fname].last_edit = Date.now()
  },

  changeFolderName(fdb, uid, newName) {
    fdb.folders[uid].name = newName;
    fdb.folders[uid].last_edit = Date.now();
  },

  deleteFolder(fdb, uid) {
    delete fdb.folders[uid];
    Object.keys(fdb.files).forEach((f) => {
      if (fdb.files[f].parent == uid) {
        delete fdb.files[f];
      }
    });
    var deleted = [];
    Object.keys(fdb.folders).forEach((f) => {
      if (fdb.folders[f].parent == uid) {
        delete fdb.folders[f];
        deleted.push(f);
      }
    });
    deleted.forEach(filedb.deleteFolder.bind(null, fdb));
  },

  deleteFile(fdb, fname) {
    delete fdb.files[fname];
  },

  createFile(fdb, fname, parent) {
    fdb.files[fname] = { contents: '', parent: parent, last_edit: Date.now() };
  },

  createFolder(fdb, fname, parent) {
    fdb.folders[Math.random()] = { name: fname, parent: parent, last_edit: Date.now() };
  },

  move_file(fdb, fname, folderuid) {
    fdb.files[fname].parent = folderuid;
  },
  
  move_folder(fdb, src, folderuid) {
    fdb.folders[src].parent = folderuid;
  },

}
