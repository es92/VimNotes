

var filedb = {
  load_localstorage(user_vim_path) {

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

    let fdb = localStorage.fdb || JSON.stringify(default_fdb);
    fdb = JSON.parse(fdb);
    return fdb;
  },

  save_localstorage(fdb) {
    localStorage.fdb = JSON.stringify(fdb);
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

  createFile(fdb, fname, parent) {
    fdb.files[fname] = { contents: '', parent: parent, last_edit: Date.now() };
  },

  createFolder(fdb, fname, parent) {
    fdb.folders[Math.random()] = { name: fname, parent: parent, last_edit: Date.now() };
  },

}
