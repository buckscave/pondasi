/* PONDASI-STORAGE.JS
   Storage adapter — deteksi PHP server, prefer PHP, fallback localStorage.
   Dipanggil saat init. Set P.storage.mode = 'server' | 'local'.
   Semua fungsi async (pakai callback) supaya compatible dengan fetch.
*/
var P = P || {};

P.storage = {
    mode: 'local',      // 'server' | 'local'
    serverUrl: '',      // URL PHP server (mis. 'http://localhost:8000/server.php')
    checking: false,
    checked: false
};

/* ======================================================================
   DETEKSI: cek apakah server.php tersedia
   ====================================================================== */
P.cekStorage = function(callback) {
    if (P.storage.checked) {
        if (callback) callback(P.storage.mode);
        return;
    }
    if (P.storage.checking) {
        // Sudah ada pengecekan berjalan, tunggu
        setTimeout(function () { P.cekStorage(callback); }, 100);
        return;
    }
    P.storage.checking = true;

    // Cek apakah halaman dibuka via http:// (bukan file://)
    if (window.location.protocol === 'file:') {
        // file:// — pasti localStorage
        P.storage.mode = 'local';
        P.storage.checked = true;
        P.storage.checking = false;
        if (callback) callback('local');
        return;
    }

    // Coba ping server.php
    var url = window.location.origin + '/server.php?action=ping';
    P.storage.serverUrl = window.location.origin + '/server.php';

    // Pakai XMLHttpRequest (ES5, no fetch dependency)
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 2000;  // 2 detik timeout
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            P.storage.checking = false;
            P.storage.checked = true;
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.ok) {
                        P.storage.mode = 'server';
                        if (callback) callback('server');
                        return;
                    }
                } catch (e) {}
            }
            // Fallback ke localStorage
            P.storage.mode = 'local';
            if (callback) callback('local');
        }
    };
    xhr.ontimeout = function () {
        P.storage.checking = false;
        P.storage.checked = true;
        P.storage.mode = 'local';
        if (callback) callback('local');
    };
    try {
        xhr.send();
    } catch (e) {
        P.storage.checking = false;
        P.storage.checked = true;
        P.storage.mode = 'local';
        if (callback) callback('local');
    }
};

/* ======================================================================
   SAVE — simpan project (server atau localStorage)
   ====================================================================== */
P.storageSave = function(callback) {
    if (!P.STATE.currentProjectId) {
        if (callback) callback(false);
        return;
    }
    P.syncToProject();
    var project = P.STATE.projects[P.STATE.currentProjectId];
    if (!project) {
        if (callback) callback(false);
        return;
    }
    var dataStr = JSON.stringify(project);

    if (P.storage.mode === 'server') {
        // Kirim ke server.php
        var url = P.storage.serverUrl + '?action=write';
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        if (data.ok) {
                            if (callback) callback(true);
                            return;
                        }
                    } catch (e) {}
                }
                // Fallback: simpan ke localStorage juga
                P.saveProjects();
                if (callback) callback(false);
            }
        };
        var params = 'id=' + encodeURIComponent(P.STATE.currentProjectId) +
                     '&data=' + encodeURIComponent(dataStr);
        try {
            xhr.send(params);
        } catch (e) {
            P.saveProjects();
            if (callback) callback(false);
        }
    } else {
        // localStorage
        P.saveProjects();
        if (callback) callback(true);
    }
};

/* ======================================================================
   LOAD — baca semua projects (server atau localStorage)
   ====================================================================== */
P.storageLoad = function(callback) {
    if (P.storage.mode === 'server') {
        var url = P.storage.serverUrl + '?action=list';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 3000;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        if (data.ok && data.projects) {
                            // Untuk setiap project di server, load full data
                            var loaded = 0;
                            var total = data.projects.length;
                            if (total === 0) {
                                P.STATE.projects = {};
                                if (callback) callback(true);
                                return;
                            }
                            P.STATE.projects = {};
                            data.projects.forEach(function (p) {
                                P.storageLoadProject(p.id, function (success, projectData) {
                                    if (success && projectData) {
                                        P.STATE.projects[p.id] = projectData;
                                    }
                                    loaded++;
                                    if (loaded >= total) {
                                        if (callback) callback(true);
                                    }
                                });
                            });
                            return;
                        }
                    } catch (e) {}
                }
                // Fallback ke localStorage
                P.loadProjects();
                if (callback) callback(false);
            }
        };
        xhr.ontimeout = function () {
            P.loadProjects();
            if (callback) callback(false);
        };
        try {
            xhr.send();
        } catch (e) {
            P.loadProjects();
            if (callback) callback(false);
        }
    } else {
        // localStorage
        P.loadProjects();
        if (callback) callback(true);
    }
};

// Load 1 project dari server
P.storageLoadProject = function(projectId, callback) {
    var url = P.storage.serverUrl + '?action=read&id=' + encodeURIComponent(projectId);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 3000;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.ok && data.data) {
                        if (callback) callback(true, data.data);
                        return;
                    }
                } catch (e) {}
            }
            if (callback) callback(false, null);
        }
    };
    xhr.ontimeout = function () {
        if (callback) callback(false, null);
    };
    try {
        xhr.send();
    } catch (e) {
        if (callback) callback(false, null);
    }
};

/* ======================================================================
   DELETE — hapus project (server atau localStorage)
   ====================================================================== */
P.storageDelete = function(projectId, callback) {
    if (P.storage.mode === 'server') {
        var url = P.storage.serverUrl + '?action=delete&id=' + encodeURIComponent(projectId);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 3000;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        if (data.ok) {
                            // Hapus dari local cache juga
                            delete P.STATE.projects[projectId];
                            if (callback) callback(true);
                            return;
                        }
                    } catch (e) {}
                }
                // Fallback: project sudah dihapus dari in-memory dict oleh pemanggil,
                // tinggal persist ke localStorage.
                P.saveProjects();
                if (callback) callback(false);
            }
        };
        xhr.ontimeout = function () {
            P.saveProjects();
            if (callback) callback(false);
        };
        try {
            xhr.send();
        } catch (e) {
            P.saveProjects();
            if (callback) callback(false);
        }
    } else {
        // localStorage mode — project sudah dihapus dari in-memory dict oleh P.deleteProject,
        // tinggal persist perubahan.
        P.saveProjects();
        if (callback) callback(true);
    }
};

/* ======================================================================
   EXPORT — tulis file ke server (export folder)
   ====================================================================== */
P.storageExport = function(nama, ext, content, callback) {
    if (P.storage.mode === 'server') {
        var url = P.storage.serverUrl + '?action=export';
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        if (data.ok) {
                            if (callback) callback(true, data.path);
                            return;
                        }
                    } catch (e) {}
                }
                // Fallback: download via browser
                P.downloadFile(nama + '.' + ext, content, 'text/' + ext + ';charset=utf-8');
                if (callback) callback(false, null);
            }
        };
        var params = 'nama=' + encodeURIComponent(nama) +
                     '&ext=' + encodeURIComponent(ext) +
                     '&content=' + encodeURIComponent(content);
        try {
            xhr.send(params);
        } catch (e) {
            P.downloadFile(nama + '.' + ext, content, 'text/' + ext + ';charset=utf-8');
            if (callback) callback(false, null);
        }
    } else {
        // localStorage mode: download via browser
        P.downloadFile(nama + '.' + ext, content, 'text/' + ext + ';charset=utf-8');
        if (callback) callback(true, null);
    }
};

/* ======================================================================
   STATUS — dapatkan mode storage saat ini
   ====================================================================== */
P.getStorageMode = function() {
    return P.storage.mode;
};

P.isServerMode = function() {
    return P.storage.mode === 'server';
};
