

function make_files(files_div, selected_file, root_folder) {
  var o = {};
  o.e = make_evented();

  list_div = files_div.querySelector('.list');
  header_div = files_div.querySelector('.header');

  function summary(contents) {
    if (contents.trim() == '') {
      return 'empty';
    }
    contents = contents.replace(/^\s*[\r\n]/gm, '');
    return contents.split('\n').slice(0,2).join('\n');

  }
  
  function mk_newfile() {
    var div = header_div.querySelector('.newfile');
    div.onclick = function(e) {
      var fname = '/home/web_user/data/' + Math.random();
      console.log('create', fname);
      selected_file = fname;
      o.e.emit('create_file', fname, root_folder);
    }
  }

  function mk_newfolder() {
    var div = header_div.querySelector('.newfolder');
    div.onclick = function(e) {
      o.e.emit('create_folder', root_folder);
    }
  }

  mk_newfile();
  mk_newfolder();

  var div = files_div.querySelector('.listpost');
  div.onclick = () => {

  };

  function render_files(fdb) {
    list_div.innerHTML = '';

    function make_folderdiv(fuid, div) {
      function make_listfile(fname) {
        var div = document.createElement('div');
        div.innerHTML = summary(filedb.contents(fdb, fname));
        div.fname = fname;
        if (fname == selected_file) {
          div.classList.add('selected');
        }
        div.onclick = function(e) {
          console.log('change', e.target.fname);
          selected_file = e.target.fname;
          o.e.emit('change', e.target.fname);
          render_files(fdb);
        }
        div.classList.add('elem');
        div.classList.add('selectable');
        return div;
      }

      function make_listfolder(uid) {
        var fname = filedb.foldername(fdb, uid);

        var div = document.createElement('div');
        var title = document.createElement('div');
        title.contentEditable = true;
        title.innerHTML = summary(fname);

        title.onblur = () => {
          o.e.emit('change_folder_name', uid, title.innerHTML);
        }
        title.onkeypress = (e) => {
          if (e.which === 13) {
            e.preventDefault();// to prevent the default enter functionality
            title.blur();            
          }
        }

        var newfile = document.createElement('div');
        newfile.innerHTML = '📝';
        newfile.classList.add('selectable');

        newfile.onclick = () => {
          var fname = '/home/web_user/data/' + Math.random();
          console.log('create', fname);
          selected_file = fname;
          o.e.emit('create_file', fname, uid);
        }

        var newfolder = document.createElement('div');
        newfolder.innerHTML = '📁';
        newfolder.classList.add('selectable');

        newfolder.onclick = () => {
          o.e.emit('create_folder', uid);
        }

        var deletefolder = document.createElement('div');
        deletefolder.innerHTML = '❌';
        deletefolder.classList.add('selectable');

        deletefolder.onclick = () => {
          o.e.emit('delete_folder', uid);
        }

        div.append(title);
        div.append(newfile);
        div.append(newfolder);
        div.append(deletefolder);

        div.uid = uid;
        div.classList.add('elem');
        div.classList.add('folder');

        var child = null;
        if (filedb.foldercontents(fdb, uid).length > 0) {
          var child = document.createElement('div');
          make_folderdiv(uid, child);
          child.classList.add('parent');
        }

        return [ div, child ];
      }

      filedb.foldercontents(fdb, fuid).forEach((f) => {
        var child;
        if (f.type == 'file') {
          child = make_listfile(f.uid);
          div.append(child);
        } else if (f.type == 'folder') {
          var [ header, child ] = make_listfolder(f.uid);
          div.append(header);
          if (child != null) {
            div.append(child);
          }
        } else {
          throw new Error('nyi');
        }
      });
    }

    make_folderdiv(fdb.root, list_div);
  }

  o.render_files = render_files;

  return o;
}
