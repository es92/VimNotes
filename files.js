

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

  var drag = {
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    dragging: false,
    enabled: false,
    div: null,
    clone: null,
  }

  function mk_draggable(div) {

    div.onmousedown = (e) => {
      document.body.classList.add('dragging');
      drag.dragging = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.enabled = false;
      drag.target_folder = null;

      drag.div = div;

      drag.clone = div.cloneNode(true);
      drag.clone.style.position = 'absolute';
      drag.clone.style.zIndex = 1000;
      drag.clone.style.left = div.offsetLeft + 'px';
      drag.clone.style.top = div.offsetTop + 'px';

      var style = window.getComputedStyle(div);
      var height = style.getPropertyValue("height");
      var width = style.getPropertyValue("width");

      drag.clone.style.width = width;
      drag.clone.style.height = height;

    }
  }

  function find_child_folder(parent, x, y) {
    var folder = null;
    Array.from(parent.children).forEach((c) => {
      var r = c.getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) {
        if (c.uid != null) {
          folder = c;
        } else {
          var subfolder = find_child_folder(c, x, y);
          if (subfolder != null) {
            folder = subfolder;
          } else {
            if (c.previousSibling != null && c.previousSibling.uid != null) {
              folder = c.previousSibling;
            }
          }
        }
      }
    });
    return folder;
  }

  window.onmouseup = () => {
    if (drag.dragging) {
      drag.dragging = false;
      document.body.classList.remove('dragging');
      if (drag.enabled) {
        document.body.removeChild(drag.clone);
        if (drag.target_folder != null) {
          drag.target_folder.classList.remove('selected');
        }

        var drag_uid;
        if (drag.target_folder == null) {
          drag_uid = root_folder;
        } else {
          drag_uid = drag.target_folder.uid;
        }
        o.e.emit('move', drag.div.fname, drag_uid);
      }
    }
  }

  window.onmousemove = (e) => {
    if (drag.dragging) {
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;

      if (!drag.enabled) {
        if (Math.sqrt(dx**2 + dy**2) > 5) {
          drag.enabled = true;
          document.body.append(drag.clone);
        }
      }

      if (drag.enabled) {

        var child_folder = find_child_folder(list_div, e.clientX, e.clientY);
        var last_target_folder = drag.target_folder;
        if (child_folder == null) {
          drag.target_folder = null;
        } else if (child_folder.uid != null) {
          drag.target_folder = child_folder;
        }
        if (drag.target_folder != last_target_folder && last_target_folder != null) {
          last_target_folder.classList.remove('selected');
        }
        if (drag.target_folder != null) {
          drag.target_folder.classList.add('selected');
        }


        drag.x = e.clientX;
        drag.y = e.clientY;

        drag.clone.style.left = (drag.clone.offsetLeft + dx) + "px";
        drag.clone.style.top = (drag.clone.offsetTop + dy) + "px";
      }
    }
  }

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
        div.classList.add('list-elem');
        div.classList.add('selectable');
        mk_draggable(div);
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
            e.preventDefault();
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
        div.classList.add('list-elem');
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
