
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

  merge(self, other) {
    let self_files = new Set(Object.keys(self.files));
    let self_folders = new Set(Object.keys(self.folders));

    let other_files = new Set(Object.keys(other.files));
    let other_folders = new Set(Object.keys(other.folders));

    let self_only_files = [...self_files].filter((s) => !other_files.has(s))
    let other_only_files = [...other_files].filter((s) => !self_files.has(s))

    let self_only_folders = [...self_folders].filter((s) => !other_folders.has(s))
    let other_only_folders = [...other_folders].filter((s) => !self_folders.has(s))

    let both_files = [...self_files].filter((s) => other_files.has(s));
    let both_folders = [...self_folders].filter((s) => other_folders.has(s));

    let changed_files = [...both_files].filter((s) => JSON.stringify(self.files[s]) !== JSON.stringify(other.files[s]));
    let changed_folders = [...both_folders].filter((s) => JSON.stringify(self.folders[s]) !== JSON.stringify(other.folders[s]));

    other_only_files.forEach((s) => {
      const file_created_since_sync = self.sync_time <= other.files[s].last_edit;
      if (file_created_since_sync) {
        self.files[s] = other.files[s];
      }
    });

    other_only_folders.forEach((s) => {
      const folder_created_since_sync = self.sync_time <= other.folders[s].last_edit;
      if (folder_created_since_sync) {
        self.folders[s] = other.folders[s];
      }
    });

    self_only_files.forEach((s) => {
      const file_created_since_sync = self.sync_time <= self.files[s].last_edit;
      if (!file_created_since_sync) {
        delete self.files[s];
      }
    });

    self_only_folders.forEach((s) => {
      const folder_created_since_sync = self.sync_time <= self.folders[s].last_edit;
      if (!folder_created_since_sync) {
        delete self.folders[s];
      }
    });

    var merge = (a, b) => {
      var dmp = new diff_match_patch();
      var diff = dmp.diff_main(a, b);
      if (diff.length > 2) {
        dmp.diff_cleanupSemantic(diff);
      }
      var patch_list = dmp.patch_make(a, b, diff);
      var patch_text = dmp.patch_toText(patch_list);
      var patches = dmp.patch_fromText(patch_text);
      var results = dmp.patch_apply(patches, a);
      return results[0];
    }


    changed_files.forEach((s) => {
      let could_be_conflict = other.files[s].last_edit >= self.sync_time;
      if (could_be_conflict) {
        const newer = other.files[s].last_edit < self.files[s].last_edit ? other : self;
        const older = other.files[s].last_edit < self.files[s].last_edit ? self : other;
        self.files[s].contents = merge(newer.files[s].contents, older.files[s].contents);
        self.files[s].last_edit = Date.now();
      }
    });

    changed_folders.forEach((s) => {
      let could_be_conflict = other.folders[s].last_edit >= self.sync_time;
      if (could_be_conflict) {
        const newer = other.folders[s].last_edit < self.folders[s].last_edit ? other : self;
        const older = other.folders[s].last_edit < self.folders[s].last_edit ? self : other;
        self.folders[s].name = merge(newer.folders[s].name, older.folders[s].name);
        self.folders[s].last_edit = Date.now();
      }
    });


    return self;
  },

}
