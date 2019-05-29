

function init_dropbox() {
  function getAccessTokenFromUrl() {
    return utils.parseQueryString(window.location.hash).access_token;
  }

  function isAuthenticated() {
    return !!getAccessTokenFromUrl();
  }

  if (isAuthenticated()) {
    return getAccessTokenFromUrl();
  } else {
    var dbx = new Dropbox.Dropbox({ clientId: 'bhkcoctaxu3rlkg' });
    var authUrl = dbx.getAuthenticationUrl('http://localhost:8080/');
    window.open(authUrl, '_self');
  }
}

// http://dropbox.github.io/dropbox-sdk-js/Dropbox.html

var dropbox_backend = {
  init() {
    var accessToken = init_dropbox();
    var dbx = new Dropbox.Dropbox({ accessToken });

    var path = '/fdb.db';

    function ab2str(buf) {
      return String.fromCharCode.apply(null, new Uint16Array(buf));
    }
    function str2ab(str) {
      var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
      var bufView = new Uint16Array(buf);
      for (var i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }

    function read() {
      return dbx.filesDownload({path: path})
      .then(function(response) {
        var blob = response.fileBlob;
        var reader = new FileReader();

        return new Promise((resolve, reject) => {
          reader.addEventListener("loadend", function() {
            try {
              var string = ab2str(reader.result);
              resolve(JSON.parse(string));
            } catch {
              reject();
            }
          });
          reader.readAsArrayBuffer(blob);
        });
      })
    }

    function write(fdb, resolve) {
      var buffer = str2ab(JSON.stringify(fdb));
      dbx.filesUpload({path: path, contents: buffer, mode: 'overwrite', mute: true })
      .then(function (response) {
        resolve();
      })
      .catch(function (error) {
        console.error('dropbox error', error)
        resolve();
      })
    }

    return {
      save(fdb) {
        return new Promise((resolve) => {

          read()
          .then((existing) => {
            if (JSON.stringify(existing) !== JSON.stringify(fdb)) {
              write(filedb.merge(fdb, JSON.parse(JSON.stringify(existing))), () => resolve(true));
            } else {
              write(fdb, () => resolve(false));
            }
          })
          .catch((error) => {
            console.error(error);
            write(fdb, () => resolve(true));
          });
        });
      },
      load(default_fdb) {
        return new Promise((resolve) => {
          read()
          .then(function(response) {
            resolve(response);
          })
          .catch(function(error) {
            console.error(error);
            resolve(default_fdb);
          });
        });
      },
    }
  }

}
