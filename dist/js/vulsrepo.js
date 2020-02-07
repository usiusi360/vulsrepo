$(document).ready(function() {
    $.each(vulsrepo_template, function(index, val) {
        localStorage.setItem("vulsrepo_pivot_conf_user_" + val.key, val.value);
    });

    setEvents();
    createFolderTree();
    db.remove("vulsrepo_pivot_conf");
    $('#drawerLeft').drawer('show');
});

const initData = function() {
    $.blockUI(blockUIoption);
    getData().done(function(resultArray) {
        vulsrepo.detailRawData = resultArray;
        vulsrepo.detailPivotData = createPivotData(resultArray);
        initPivotTable();
    }).fail(function(result) {
        $.unblockUI(blockUIoption);
        if (result === "notSelect") {
            showAlert("Not Selected", "File is not selected.");
        } else {
            showAlert(result.status + " " + result.statusText, result.responseText);
        }
    });
};

const initPivotTable = function() {
    $.blockUI(blockUIoption);
    setTimeout(function() {
        displayPivot(vulsrepo.detailPivotData);
        setPulldown("#drop_topmenu");
        setPulldownDisplayChangeEvent("#drop_topmenu");
        filterDisp.off("pivot_conf");
        $.unblockUI(blockUIoption);
    }, 500);
};

let packageTable = $("#table-package").DataTable();
const clipboard = new Clipboard('.btn');

const db = {
    set: function(key, obj) {
        localStorage.setItem(key, JSON.stringify(obj));
    },
    get: function(key) {
        return JSON.parse(localStorage.getItem(key));
    },
    remove: function(key) {
        localStorage.removeItem(key);
    },
    setPivotConf: function(key, obj) {
        localStorage.setItem("vulsrepo_pivot_conf_user_" + key, JSON.stringify(obj));
    },
    getPivotConf: function(key) {
        return JSON.parse(localStorage.getItem("vulsrepo_pivot_conf_user_" + key));
    },
    removePivotConf: function(key) {
        localStorage.removeItem("vulsrepo_pivot_conf_user_" + key);
    },
    listPivotConf: function(key) {
        var array = [];
        for (var i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).indexOf('vulsrepo_pivot_conf_user_') != -1) {
                array.push(localStorage.key(i).replace(/vulsrepo_pivot_conf_user_/g, ''));
            }
        }
        return array;
    }
};

const filterDisp = {
    on: function(labelName) {
        $(labelName).removeClass("label-info").addClass("label-warning").text("Filter ON");
    },

    off: function(labelName) {
        $(labelName).removeClass("label-warning").addClass("label-info").text("Filter OFF");
    }
};

const fadeAlert = function(target) {
    $(target).fadeIn(1000).delay(2000).fadeOut(1000);
};

const showAlert = function(code, text) {
    $("#alert_error_code").empty();
    $("#alert_responce_text").empty();
    $("#alert_error_code").append("<div>" + code + "</div>");
    $("#alert_responce_text").append("<div>" + text + "</div>");
    $("#modal-alert").modal('show');
};

const blockUIoption = {
    message: '<h4><img src="./dist/img/loading.gif" />　Please Wait...</h4>',
    fadeIn: 200,
    fadeOut: 200,
    css: {
        border: 'none',
        padding: '15px',
        backgroundColor: '#000',
        '-webkit-border-radius': '10px',
        '-moz-border-radius': '10px',
        opacity: .5,
        color: '#fff'
    }
};

const getData = function() {

    $.ajaxSetup({
        timeout: vulsrepo.timeOut
    });

    var kickCount = 0;
    var endCount = 0;
    var resultArray = [];
    var defer = new $.Deferred();

    var selectedFiles = getSelectedFile();

    if (selectedFiles.length === 0) {
        defer.reject("notSelect");
        return defer.promise();
    }

    $.each(selectedFiles, function(key, value) {
        var url = value.url;
        $.getJSON(url).done(function(json_data) {
            endCount++;
            var resultMap = {
                scanTime: value.parent_title,
                data: json_data
            };

		if (resultMap.data.jsonVersion === undefined) {
               showAlert("Old JSON format", value.url);
               $.unblockUI(blockUIoption);
                return;
            }

            if (resultMap.data.reportedAt === "0001-01-01T00:00:00Z") {
                showAlert("Vuls report is not running ", value.url);
                $.unblockUI(blockUIoption);
                return;
            }

            resultArray.push(resultMap);
            if (kickCount == endCount) {
                defer.resolve(resultArray);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            defer.reject(jqXHR);
        });
        kickCount++;
    });
    return defer.promise();
};

const getSelectedFile = function() {
    var selectedFile = $.map($("#folderTree").dynatree("getSelectedNodes"), function(node) {
        if (node.data.isFolder === false) {
            var data = {
                title: node.data.title,
                url: "results" + node.data.url,
                parent_title: node.parent.data.title
            };
            return (data);
        }
    });
    return selectedFile;
};

const setPulldown = function(target) {
    $(target).empty();
    $.each(db.listPivotConf(), function(index, val) {
        $(target).append('<li><a href="javascript:void(0)" value=\"' + val + '\">' + val + '</a></li>');
    });

    $(target + ' a').off('click');
    $(target + ' a').on('click', function() {
        $(target + "_visibleValue").html($(this).attr('value'));
        $(target + "_hiddenValue").val($(this).attr('value'));
    });

};

const setPulldownDisplayChangeEvent = function(target) {
    $(target + ' a').on('click', function() {
        var value = db.getPivotConf($(this).attr('value'));
        db.set("vulsrepo_pivot_conf", value);
        initPivotTable();
    });
};

const setEvents = function() {

    // ---file select
    $(".submitSelectfile").click(function() {
        $('#drawerLeft').drawer('hide');
        setTimeout(initData, 500);
    });

    $("#btnSelectAll").click(function() {
        $("#folderTree").dynatree("getRoot").visit(function(node) {
            node.select(true);
        });
        return false;
    });

    $("#btnDeselectAll").click(function() {
        $("#folderTree").dynatree("getRoot").visit(function(node) {
            node.select(false);
        });
        return false;
    });

    // ---pivot setting
    $("#save_pivot_conf").click(function() {
        $("#alert_saveDiag_textbox").css("display", "none");
        $("#alert_saveDiag_dropdown").css("display", "none");
        $("#input_saveDiag").val("");
        $("#drop_saveDiag_visibleValue").html("Select setting");
        $("#drop_saveDiag_hiddenValue").val("");

        setPulldown("#drop_saveDiag");
        $("#modal-saveDiag").modal('show');
    });

    $('input[name=radio_setting]:eq(0)').click(function() {
        $("#input_saveDiag").prop("disabled", false);
        $('#drop_saveDiag_buttonGroup button').prop("disabled", true);
    });

    $('input[name=radio_setting]:eq(1)').click(function() {
        $("#input_saveDiag").prop("disabled", true);
        $('#drop_saveDiag_buttonGroup button').prop("disabled", false);
    });

    $("#ok_saveDiag").click(function() {
        var configName;
        if ($('input[name=radio_setting]:eq(0)').prop('checked')) {
            configName = $("#input_saveDiag").val();
            if (configName !== "") {
                db.setPivotConf(configName, db.get("vulsrepo_pivot_conf_tmp"));
            } else {
                $("#alert_saveDiag_textbox").css("display", "");
                return;
            }
        } else {
            configName = $("#drop_saveDiag_hiddenValue").attr('value');

            if (configName !== "") {
                db.setPivotConf(configName, db.get("vulsrepo_pivot_conf_tmp"));
            } else {
                $("#alert_saveDiag_dropdown").css("display", "");
                return;
            }

        }

        setPulldown("#drop_topmenu");
        setPulldownDisplayChangeEvent("#drop_topmenu");
        $("#drop_topmenu_visibleValue").html(configName);
        $("#drop_topnemu_hiddenValue").val(configName);

        $("#modal-saveDiag").modal('hide');
        filterDisp.on("#label_pivot_conf");
        fadeAlert("#alert_pivot_conf");

    });

    $("#cancel_saveDiag").click(function() {
        $("#modal-saveDiag").modal('hide');
    });

    $("#delete_pivot_conf").click(function() {
        db.removePivotConf($("#drop_topmenu_hiddenValue").attr('value'));
        db.remove("vulsrepo_pivot_conf");
        $("#drop_topmenu_visibleValue").html("Select setting");
        $("#drop_topnemu_hiddenValue").val("");
        filterDisp.off("#label_pivot_conf");
        fadeAlert("#alert_pivot_conf");
        initPivotTable();
    });

    $("#clear_pivot_conf").click(function() {
        db.remove("vulsrepo_pivot_conf");
        $("#drop_topmenu_visibleValue").html("Select setting");
        $("#drop_topnemu_hiddenValue").val("");
        filterDisp.off("#label_pivot_conf");
        fadeAlert("#alert_pivot_conf");
        initPivotTable();
    });

    // ---detail cveid
    $('a[href="#package-r"]').click(function() {
        setTimeout(function() { packageTable.columns.adjust(); }, 1);
    });

    // displayHelpMes();
    displayHelpMesScore();

    // ---all setting
    $("#Setting").click(function() {
        $("#modal-setting").modal('show');
    });

    $("#modal-setting").on("hidden.bs.modal", function() {
        initData();
    });

    // ---switch
    $("[name='chkPivotSummary']").bootstrapSwitch();
    $("[name='chkPivotCvss']").bootstrapSwitch();

    if (db.get("vulsrepo_chkPivotSummary") === "false") {
        $('input[name="chkPivotSummary"]').bootstrapSwitch('state', false, false);
    }
    if (db.get("vulsrepo_chkPivotCvss") === "false") {
        $('input[name="chkPivotCvss"]').bootstrapSwitch('state', false, false);
    }

    $('input[name="chkPivotSummary"]').on('switchChange.bootstrapSwitch', function(event, state) {
        if (state === false) {
            db.set("vulsrepo_chkPivotSummary", "false");
        } else {
            db.remove("vulsrepo_chkPivotSummary");
        }
    });
    $('input[name="chkPivotCvss"]').on('switchChange.bootstrapSwitch', function(event, state) {
        if (state === false) {
            db.set("vulsrepo_chkPivotCvss", "false");
        } else {
            db.remove("vulsrepo_chkPivotCvss");
        }
    });

    // ---priority

    var priority = db.get("vulsrepo_pivotPriority");
    if (priority === null) {
        db.set("vulsrepo_pivotPriority", vulsrepo.detailTaget);
    }

    if (Array.isArray(priority) === false) {
        db.set("vulsrepo_pivotPriority", vulsrepo.detailTaget);
    }

    if (priority != null && priority.length !== 7) {
        db.set("vulsrepo_pivotPriority", vulsrepo.detailTaget);
    }

    $.each(db.get("vulsrepo_pivotPriority"), function(i, i_val) {
        $("#pivot-priority").append('<li class="ui-state-default"><span class="fa fa-arrows-v" aria-hidden="true"></span>' + i_val + '</li>');
    });
    $('#pivot-priority').sortable({
        tolerance: "pointer",
        distance: 1,
        cursor: "move",
        revert: 100,
        placeholder: "placeholder",
        update: function() {
            let tmp_pri = [];
            $("#pivot-priority li").each(function(index) {
                tmp_pri.push($(this).text());
            });
            db.set("vulsrepo_pivotPriority", tmp_pri);
        }
    });
    $('#pivot-priority').disableSelection();

    $("#pivot-link").click(function() {
        let str = location.href + "?vulsrepo_pivot_conf_tmp=" + LZString.compressToEncodedURIComponent(localStorage.getItem("vulsrepo_pivot_conf_tmp"));
        $("#view_url_box").val("");
        $("#view_url_box").val(str);
        $("#modal-viewUrl").modal('show');
    });

};

const createFolderTree = function() {

    var target;
    if (vulsrepo.demoFlag === true) {
        target = "getfilelist.json"
    } else {
        target = "getfilelist/"
    }

    var tree = $("#folderTree").dynatree({
        initAjax: {
            url: target
        },
        ajaxDefaults: {
            cache: false,
            timeout: 120000,
            dataType: "json"
        },
        minExpandLevel: 1,
        persist: false,
        clickFolderMode: 2,
        checkbox: true,
        selectMode: 3,
        fx: {
            height: "toggle",
            duration: 200
        },
        noLink: false,
        debugLevel: 0
    });
};

const isCheckNull = function(o) {
    if (o === undefined) {
        return true;
    } else if (o === null) {
        return true;
    } else if (o.length === 0) {
        return true;
    }
    return false;
}

const createPivotData = function(resultArray) {
    let array = [];
    let cveid_count = 0;
    const prioltyFlag = db.get("vulsrepo_pivotPriority");
    const summaryFlag = db.get("vulsrepo_chkPivotSummary");
    const cvssFlag = db.get("vulsrepo_chkPivotCvss");

    $.each(resultArray, function(x, x_val) {
        if (Object.keys(x_val.data.scannedCves).length === 0) {

            let result = {
                "ScanTime": x_val.scanTime,
                "Family": x_val.data.family,
                "Release": x_val.data.release,
                "CveID": "healthy",
                "Packages": "healthy",
                "NotFixedYet": "healthy",
                "PackageVer": "healthy",
                "NewPackageVer": "healthy",
                "CweID": "healthy",
                "Summary": "healthy",
                "CVSS Score": "healthy",
                "CVSS Severity": "healthy",
                "CVSSv3 (AV)": "healthy",
                "CVSSv3 (AC)": "healthy",
                "CVSSv3 (PR)": "healthy",
                "CVSSv3 (UI)": "healthy",
                "CVSSv3 (S)": "healthy",
                "CVSSv3 (C)": "healthy",
                "CVSSv3 (I)": "healthy",
                "CVSSv3 (A)": "healthy",
                "CVSS (AV)": "healthy",
                "CVSS (AC)": "healthy",
                "CVSS (Au)": "healthy",
                "CVSS (C)": "healthy",
                "CVSS (I)": "healthy",
                "CVSS (A)": "healthy",
                "AdvisoryID": "healthy",
                "CERT": "healthy",
                "PoC": "healthy",
                "Changelog": "healthy",
                "DetectionMethod": "healthy",
                "Published": "healthy",
                "Last Modified": "healthy",
            };

            if (x_val.data.runningKernel.rebootRequired === true) {
                result["ServerName"] = x_val.data.serverName + " [Reboot Required]";
            } else {
                result["ServerName"] = x_val.data.serverName;
            }

            if (x_val.data.platform.name !== "") {
                result["Platform"] = x_val.data.platform.name;
            } else {
                result["Platform"] = "None";
            }

            if (x_val.data.container.name !== "") {
                result["Container"] = x_val.data.container.name;
            } else {
                result["Container"] = "None";
            }
            array.push(result);
        } else {
            $.each(x_val.data.scannedCves, function(y, y_val) {
                let targetNames;
                if (isCheckNull(y_val.cpeNames) === false) {
                    targetNames = y_val.cpeNames;
                } else if(isCheckNull(y_val.cpeURIs) === false) {
                    targetNames = y_val.cpeURIs;
                } else {
                    targetNames = y_val.affectedPackages;
                }

                cveid_count = cveid_count + 1
                $.each(targetNames, function(p, p_val) {
                    if (p_val.name === undefined) {
                        pkgName = p_val;
                        NotFixedYet = "Unknown";
                    } else {
                        pkgName = p_val.name;
                        NotFixedYet = p_val.notFixedYet;
                    }

                    let pkgInfo = x_val.data.packages[pkgName];
                    if (pkgName.indexOf('cpe:/') === -1 && pkgInfo === undefined) {
                        return;
                    }

                    let result = {
                        "ScanTime": x_val.scanTime,
                        "Family": x_val.data.family,
                        "Release": x_val.data.release,
                        "CveID": "CHK-cveid-" + y_val.cveID,
                        "Packages": pkgName,
                        "NotFixedYet": NotFixedYet,
                    };

                    if (x_val.data.runningKernel.rebootRequired === true) {
                        result["ServerName"] = x_val.data.serverName + " [Reboot Required]";
                    } else {
                        result["ServerName"] = x_val.data.serverName;
                    }

                    if (y_val.cveContents.nvd !== undefined) {
                        let cweIds = y_val.cveContents.nvd.cweIDs;
                        let cweIdStr = "";
                        if (cweIds !== undefined) {
                            // NVD-CWE-Other and NVD-CWE-noinfo
                            if(cweIds[0].indexOf("NVD-CWE-") !== -1) {
                                result["CweID"] = cweIds[0];
                            } else {
                                // TODO OWASP Top Ten 2017 https://owasp.org/www-project-top-ten/OWASP_Top_Ten_2017/Top_10-2017_Top_10.html
                                // CWE Top25 https://cwe.mitre.org/top25/archive/2019/2019_cwe_top25.html
                                let cweTop25 = ["119", "79", "20", "200", "125", "89", "416", "190", "352", "22", "78", "787", "287", "476", "732", "434", "611", "94", "798", "400", "772", "426", "502", "269", "295"]
                                // TODO SANS Top25 https://www.sans.org/top25-software-errors/
                                for(var j = 0; j < cweIds.length; j++) {
                                    let match = false;
                                    for(var i = 0; i < cweTop25.length; i++) {
                                        if(cweIds[j].indexOf(cweTop25[i]) !== -1) {
                                            match = true;
                                            break;
                                        }
                                    }
                                    if (match === true) {
                                        cweIdStr = cweIdStr + cweIds[j] + "[!!]";
                                    } else {
                                        cweIdStr = cweIdStr + cweIds[j];
                                    }
                                    if (j < cweIds.length - 1) {
                                        cweIdStr = cweIdStr + ",";
                                    }
                                }
                                result["CweID"] = "CHK-cweid-" + cweIdStr;
                            }
                        } else {
                            result["CweID"] = "None";
                        }
                    } else {
                        result["CweID"] = "None";
                    }

                    if (x_val.data.platform.name !== "") {
                        result["Platform"] = x_val.data.platform.name;
                    } else {
                        result["Platform"] = "None";
                    }

                    if (x_val.data.container.name !== "") {
                        result["Container"] = x_val.data.container.name;
                    } else {
                        result["Container"] = "None";
                    }

                    if (y_val.alertDict.ja != null) {
                        result["CERT"] = "CHK-CERT-" + y_val.alertDict.ja[0].url;
                    } else {
                        result["CERT"] = "";
                    }

                    if (y_val.exploits !== undefined) {
                        result["PoC"] = "PoC(" + y_val.exploits.length + ")";
                    } else {
                        result["PoC"] = "";
                    }

                    if (y_val.distroAdvisories !== undefined) {
                        result["AdvisoryID"] = "CHK-advisoryid-" + y_val.distroAdvisories[0].advisoryID;
                    } else {
                        result["AdvisoryID"] = "None";
                    }

                    DetectionMethod = y_val.confidences[0].detectionMethod;
                    result["DetectionMethod"] = DetectionMethod;
                    if (DetectionMethod === "ChangelogExactMatch") {
                        result["Changelog"] = "CHK-changelog-" + y_val.cveID + "," + x_val.scanTime + "," + x_val.data.serverName + "," + x_val.data.container.name + "," + pkgName;
                    } else {
                        result["Changelog"] = "None";
                    }

                    if (pkgInfo !== undefined) {
                        if (pkgInfo.Version !== "") {
                            result["PackageVer"] = pkgInfo.version + "-" + pkgInfo.release;
                        } else {
                            result["PackageVer"] = "None";
                        }

                        if (pkgInfo.NewVersion !== "") {
                            result["NewPackageVer"] = pkgInfo.newVersion + "-" + pkgInfo.newRelease;
                        } else {
                            result["NewPackageVer"] = "None";
                        }
                    } else {
                        // ===for cpe
                        result["PackageVer"] = "Unknown";
                        result["NewPackageVer"] = "Unknown";
                    }


                    let getCvss = function(target) {
                        if (y_val.cveContents[target] === undefined) {
                            return false;
                        }

                        if (y_val.cveContents[target].cvss2Score === 0 & y_val.cveContents[target].cvss3Score === 0) {
                            return false;
                        }

                        if (y_val.cveContents[target].cvss3Score !== 0) {
                            result["CVSS Score"] = y_val.cveContents[target].cvss3Score;
                            result["CVSS Severity"] = getSeverityV3(y_val.cveContents[target].cvss3Score);
                            result["CVSS Score Type"] = target + "V3";
                        } else if (y_val.cveContents[target].cvss2Score !== 0) {
                            result["CVSS Score"] = y_val.cveContents[target].cvss2Score;
                            result["CVSS Severity"] = getSeverityV2(y_val.cveContents[target].cvss2Score);
                            result["CVSS Score Type"] = target;
                        }

                        if (summaryFlag !== "false") {
                            result["Summary"] = y_val.cveContents[target].summary;
                        }

                        if (cvssFlag !== "false") {
                            if (y_val.cveContents[target].cvss3Vector !== "") { //ex) CVE-2016-5483
                                var arrayVector = getSplitArray(y_val.cveContents[target].cvss3Vector);
                                let cvssv3 = getVectorV3.cvss(arrayVector[1]);
                                result["CVSSv3 (AV)"] = cvssv3[0] + "(" + cvssv3[1] + ")";
                                cvssv3 = getVectorV3.cvss(arrayVector[2]);
                                result["CVSSv3 (AC)"] = cvssv3[0] + "(" + cvssv3[1] + ")";
                                cvssv3 = getVectorV3.cvss(arrayVector[3]);
                                result["CVSSv3 (PR)"] = cvssv3[0] + "(" + cvssv3[1] + ")";
                                cvssv3 = getVectorV3.cvss(arrayVector[4]);
                                result["CVSSv3 (UI)"] = cvssv3[0] + "(" + cvssv3[1] + ")";
                                cvssv3 = getVectorV3.cvss(arrayVector[5]);
                                result["CVSSv3 (S)"] = cvssv3[0] + "(" + cvssv3[1] + ")";
                                cvssv3 = getVectorV3.cvss(arrayVector[6]);
                                result["CVSSv3 (C)"] = cvssv3[0] + "(" + cvssv3[1] + ")";
                                cvssv3 = getVectorV3.cvss(arrayVector[7]);
                                result["CVSSv3 (I)"] = cvssv3[0] + "(" + cvssv3[1] + ")";
                                cvssv3 = getVectorV3.cvss(arrayVector[8]);
                                result["CVSSv3 (A)"] = cvssv3[0] + "(" + cvssv3[1] + ")";
                            } else {
                                result["CVSSv3 (AV)"] = "Unknown";
                                result["CVSSv3 (AC)"] = "Unknown";
                                result["CVSSv3 (PR)"] = "Unknown";
                                result["CVSSv3 (UI)"] = "Unknown";
                                result["CVSSv3 (S)"] = "Unknown";
                                result["CVSSv3 (C)"] = "Unknown";
                                result["CVSSv3 (I)"] = "Unknown";
                                result["CVSSv3 (A)"] = "Unknown";
                            }
                            if (y_val.cveContents[target].cvss2Vector !== "") { //ex) CVE-2016-5483
                                var arrayVector = getSplitArray(y_val.cveContents[target].cvss2Vector);
                                result["CVSS (AV)"] = getVectorV2.cvss(arrayVector[0])[0];
                                result["CVSS (AC)"] = getVectorV2.cvss(arrayVector[1])[0];
                                result["CVSS (Au)"] = getVectorV2.cvss(arrayVector[2])[0];
                                result["CVSS (C)"] = getVectorV2.cvss(arrayVector[3])[0];
                                result["CVSS (I)"] = getVectorV2.cvss(arrayVector[4])[0];
                                result["CVSS (A)"] = getVectorV2.cvss(arrayVector[5])[0];
                            } else {
                                result["CVSS (AV)"] = "Unknown";
                                result["CVSS (AC)"] = "Unknown";
                                result["CVSS (Au)"] = "Unknown";
                                result["CVSS (C)"] = "Unknown";
                                result["CVSS (I)"] = "Unknown";
                                result["CVSS (A)"] = "Unknown";
                            }
                            // yyyy-mm-dd
                            let getDateStr = function(datetime) {
                                let d = new Date(datetime);
                                const year = d.getFullYear();
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const day = String(d.getDate()).padStart(2, '0');

                                let str = `${year}-${month}-${day}`
                                if (Date.now() - d.getTime() < 86400000 * 15) {
                                    // Last 15 days
                                    str += " [New!]";
                                }

                                return str;
                            };
                            result["Published"] = getDateStr(y_val.cveContents[target].published);
                            result["Last Modified"] = getDateStr(y_val.cveContents[target].lastModified);
                        }

                        return true;
                    };

                    let flag = false;
                    $.each(prioltyFlag, function(i, i_val) {
                        if (flag !== true) {
                            flag = getCvss(i_val);
                        }
                    });

                    if (flag === false) {
                        result["Summary"] = "Unknown";
                        result["CVSS Score"] = "Unknown";
                        result["CVSS Severity"] = "Unknown";
                        result["CVSS Score Type"] = "Unknown";
                        result["CVSSv3 (AV)"] = "Unknown";
                        result["CVSSv3 (AC)"] = "Unknown";
                        result["CVSSv3 (PR)"] = "Unknown";
                        result["CVSSv3 (UI)"] = "Unknown";
                        result["CVSSv3 (S)"] = "Unknown";
                        result["CVSSv3 (C)"] = "Unknown";
                        result["CVSSv3 (I)"] = "Unknown";
                        result["CVSSv3 (A)"] = "Unknown";
                        result["CVSS (AV)"] = "Unknown";
                        result["CVSS (AC)"] = "Unknown";
                        result["CVSS (Au)"] = "Unknown";
                        result["CVSS (C)"] = "Unknown";
                        result["CVSS (I)"] = "Unknown";
                        result["CVSS (A)"] = "Unknown";
                        result["Published"] = "Unknown";
                        result["Last Modified"] = "Unknown";
                    }

                    array.push(result);
                });
            });
        }
    });

    console.info("CveidCount: " + cveid_count);
    console.info("PivotDataCount: " + array.length);
    return array;
};

const displayPivot = function(array) {

    var url_param;
    if (location.search !== "") {
        try {
            var decode_str = LZString.decompressFromEncodedURIComponent(location.search.substring(1).split('=')[1])
            if (decode_str === null) {
                showAlert("param decode error", decode_str);
                return;
            }
            url_param = JSON.parse(decode_str);
        } catch (e) {
            showAlert("param parse error", e);
            return;
        }
    }

    var url = window.location.href
    var new_url = url.replace(/\?.*$/, "");
    history.replaceState(null, null, new_url);


    var derivers = $.pivotUtilities.derivers;
    var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.c3_renderers);
    var dateFormat = $.pivotUtilities.derivers.dateFormat;
    var sortAs = $.pivotUtilities.sortAs;
    var naturalSort = $.pivotUtilities.naturalSort;

    var pivot_attr = {
        renderers: renderers,
        menuLimit: 3000,
        rows: ["ScanTime", "ServerName", "Container"],
        cols: ["CVSS Severity", "CVSS Score"],
        vals: [""],
        exclusions: "",
        aggregatorName: "Count",
        rendererName: "Heatmap",
        rendererOptions: {
            heatmap: {
                colorScaleGenerator: function(values) {
                    return d3.scale.sqrt()
                        .domain([0, array.length])
                        .range(["#ffffff", "#fa8072"])
                }
            }
        },
        sorters: {
            "CVSS Severity": sortAs(["healthy", "Unknown", "Critical", "High", "Medium", "Low"]),
            "CveID": sortAs(["healthy"]),
            "CweID": sortAs(["healthy"]),
            "Packages": sortAs(["healthy"]),
            "CVSS Score": function (a, b) { return -naturalSort(a, b); }, // sort backwards
            "Summary": sortAs(["healthy"]),
            "CVSSv3 (AV)": sortAs(["healthy"]),
            "CVSSv3 (AC)": sortAs(["healthy"]),
            "CVSSv3 (PR)": sortAs(["healthy"]),
            "CVSSv3 (UI)": sortAs(["healthy"]),
            "CVSSv3 (S)": sortAs(["healthy"]),
            "CVSSv3 (C)": sortAs(["healthy"]),
            "CVSSv3 (I)": sortAs(["healthy"]),
            "CVSSv3 (A)": sortAs(["healthy"]),
            "CVSS (AV)": sortAs(["healthy"]),
            "CVSS (AC)": sortAs(["healthy"]),
            "CVSS (Au)": sortAs(["healthy"]),
            "CVSS (C)": sortAs(["healthy"]),
            "CVSS (I)": sortAs(["healthy"]),
            "CVSS(I)": sortAs(["healthy"]),
            "CERT": function (a, b) { return -naturalSort(a, b); }, // sort backwards
            "PoC": function (a, b) { return -naturalSort(a, b); }, // sort backwards
            "Published": function (a, b) { return -naturalSort(a, b); }, // sort backwards
            "Last Modified": function (a, b) { return -naturalSort(a, b); } // sort backwards
        },
        onRefresh: function(config) {
            db.set("vulsrepo_pivot_conf_tmp", config);
            $("#pivot_base").find(".pvtVal[data-value='null']").css("background-color", "#b2f3b2");

            $("#pivot_base").find("th:contains('Critical')").each(function() {
                if ($(this).text() === "Critical") {
                    $(this).addClass("pvt-cvss-Critical");
                }
            });
            $("#pivot_base").find("th:contains('High')").each(function() {
                if ($(this).text() === "High") {
                    $(this).addClass("pvt-cvss-High");
                }
            });
            $("#pivot_base").find("th:contains('Medium')").each(function() {
                if ($(this).text() === "Medium") {
                    $(this).addClass("pvt-cvss-Medium");
                }
            });
            $("#pivot_base").find("th:contains('Low')").each(function() {
                if ($(this).text() === "Low") {
                    $(this).addClass("pvt-cvss-Low");
                }
            });

            $("#pivot_base").find("th:contains('true')").each(function() {
                if ($(this).text() === "true") {
                    $(this).addClass("notfixyet-true");
                }
            });

            $("#pivot_base").find("th:contains('false')").each(function() {
                if ($(this).text() === "false") {
                    $(this).addClass("notfixyet-false");
                }
            });

            $("#pivot_base").find("th:contains('healthy')").css("background-color", "lightskyblue");
            $("#pivot_base").find("th:contains('CveID')").css("minWidth", "110px");
            $("#pivot_base").find("th:contains('Reboot Required')").css("color", "#da0b00");
            addAdvisoryIDLink();
            addCertLink();
            addCveIDLink();
            addCweIDLink();
            addChangelogLink();
        }

    };

    var pivot_obj;
    if (url_param != null) {
        pivot_obj = url_param;
    } else {
        pivot_obj = db.get("vulsrepo_pivot_conf");
    }

    if (pivot_obj != null) {
        pivot_attr["rows"] = pivot_obj["rows"];
        pivot_attr["cols"] = pivot_obj["cols"];
        pivot_attr["vals"] = pivot_obj["vals"];
        pivot_attr["exclusions"] = pivot_obj["exclusions"];
        pivot_attr["aggregatorName"] = pivot_obj["aggregatorName"];
        pivot_attr["rendererName"] = pivot_obj["rendererName"];
        pivot_attr["rowOrder"] = pivot_obj["rowOrder"];
        pivot_attr["colOrder"] = pivot_obj["colOrder"];
        pivot_attr["rendererOptions"] = pivot_obj["rendererOptions"];
        filterDisp.on("#label_pivot_conf");
    } else {
        filterDisp.off("#label_pivot_conf");
    }

    $("#pivot_base").pivotUI(array, pivot_attr, {
        overwrite: "true"
    });

};

const addCveIDLink = function() {
    let doms = $("#pivot_base").find("th:contains('CHK-cveid-')");
    doms.each(function() {
        let cveid = $(this).text().replace("CHK-cveid-", "");
        $(this).text("").append('<a class="cveid">' + cveid + '</a>');
    });

    $('.cveid').on('click', function() {
        displayDetail(this.text);
    });
};

const addCweIDLink = function() {
    const prioltyFlag = db.get("vulsrepo_pivotPriority");
    let nvd = prioltyFlag.indexOf("nvd");
    let jvn = prioltyFlag.indexOf("jvn");

    let doms = $("#pivot_base").find("th:contains('CHK-cweid-')");
    doms.each(function() {
        let cveid = $(this).text();
        cveid = cveid.replace("CHK-cweid-", "");
        let cveids = cveid.split(',');
        let generated = "";
        for (var i = 0; i < cveids.length; i++) {
            if (cveids[i].indexOf("NVD-CWE-") !== -1) {
                // NVD-CWE-Other and NVD-CWE-noinfo
                generated = generated + cveids[i];
            } else {
                if (nvd < jvn) {
                    // NVD
                    generated = generated + "<a href=\"" + detailLink.cwe_nvd.url + cveids[i].replace(/\[!!\]/, "").replace(/CWE-/, "") + "\" target='_blank'>" + cveids[i] + "</a>";
                } else {
                    // JVN
                    generated = generated + "<a href=\"" + detailLink.cwe_jvn.url + cveids[i].replace(/\[!!\]/, "") + ".html\" target='_blank'>" + cveids[i] + "</a>";
                }
            }
            if (i < cveids.length - 1) {
                generated = generated + ",";
            }
        }
        $(this).text("").append(generated);
    });
};

const addAdvisoryIDLink = function() {
    let doms = $("#pivot_base").find("th:contains('CHK-advisoryid-')");
    doms.each(function() {
        let advisoryid = $(this).text().replace("CHK-advisoryid-", "");
        // Open Advisory page
        if (advisoryid.indexOf('ALAS2-') != -1) {
            // ALAS2
            $(this).text("").append("<a href=\"" + detailLink.amazon.url + "AL2/" + advisoryid.replace("ALAS2-", "ALAS-") + ".html\" target='_blank'>" + advisoryid + '</a>');
        } else if (advisoryid.indexOf('ALAS-') != -1) {
            // TODO ALAS
        }
        // TODO RHSA
        // TODO ELSA
        // TODO OVMSA
    });
};

const addCertLink = function() {
    let doms = $("#pivot_base").find("th:contains('CHK-CERT-')");
    doms.each(function() {
        let cert = $(this).text().replace("CHK-CERT-", "");
        $(this).text("").append("<a href=\"" + cert + "\" target='_blank'>JPCERT</a>");
    });
};

const addChangelogLink = function() {
    let doms = $("#pivot_base").find("th:contains('CHK-changelog-')");
    doms.each(function() {
        let changelogSearch = $(this).text().replace("CHK-changelog-", "").split(",");
        $(this).text("").append('<a href="#contents" class="lightbox" data-cveid="' + changelogSearch[0] + '" data-scantime="' + changelogSearch[1] + '" data-server="' + changelogSearch[2] + '" data-container="' + changelogSearch[3] + '" data-package="' + changelogSearch[4] + '">Changelog</a>');
    });
    addEventDisplayChangelog();
};

const createDetailData = function(cveID) {
    var targetObj = { cveContents: {} };
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        tmpCve = x_val.data.scannedCves[cveID];
        if (tmpCve !== undefined) {
            targetObj["cveID"] = cveID;
            targetObj["DistroAdvisories"] = tmpCve.distroAdvisories;
            $.each(vulsrepo.detailTaget, function(i, i_val) {
                if (tmpCve.cveContents[i_val] !== undefined) {
                    targetObj.cveContents[i_val] = tmpCve.cveContents[i_val];
                }
            });
        }
    });
    return targetObj;
};


const initDetail = function() {
    $("#modal-label").text("");
    $("#count-References").text("0");
    $("#CweID,#Link,#References").empty();

    $.each(vulsrepo.detailTaget, function(i, i_val) {
        $("#typeName_" + i_val).empty();
        $("#typeName_" + i_val + "V3").empty();
        $("#scoreText_" + i_val).text("").removeClass();
        $("#scoreText_" + i_val + "V3").text("").removeClass();
        $("#summary_" + i_val).empty();
        $("#lastModified_" + i_val).empty();
    });
};


const displayDetail = function(cveID) {
    initDetail();
    let data = createDetailData(cveID);

    // ---CVSS Detail
    $("#modal-label").text(data.cveID);

    let dispCvss = function(target) {
        if (data.cveContents[target] !== undefined) {
            scoreV2 = data.cveContents[target].cvss2Score;
            scoreV3 = data.cveContents[target].cvss3Score;

            if (scoreV2 !== 0) {
                severityV2 = getSeverityV2(scoreV2);
            }
            if (scoreV3 !== 0) {
                severityV3 = getSeverityV3(scoreV3);
            }

            if (scoreV2 !== 0) {
                $("#scoreText_" + target).text(scoreV2 + " (" + severityV2 + ")").addClass("cvss-" + severityV2);
            } else {
                $("#scoreText_" + target).text("None").addClass("cvss-None");
            }

            if (scoreV3 !== 0) {
                $("#scoreText_" + target + "V3").text(scoreV3 + " (" + severityV3 + ")").addClass("cvss-" + severityV3);
            } else {
                $("#scoreText_" + target + "V3").text("None").addClass("cvss-None");
            }

            if (target === "ubuntu" || target === "debian" || target === "amazon") {
                severity = data.cveContents[target].cvss2Severity;
                $("#scoreText_" + target).removeClass();
                $("#scoreText_" + target).text(severity).addClass("cvss-" + severity);
            }

            if (data.cveContents[target].Summary !== "") {
                $("#summary_" + target).append("<div>" + data.cveContents[target].summary + "<div>");
            }

            if (data.cveContents[target].lastModified !== "0001-01-01T00:00:00Z") {
                $("#lastModified_" + target).text(data.cveContents[target].lastModified.split("T")[0]);
            } else {
                $("#lastModified_" + target).text("------");
                $("#lastModified_" + target + "V3").text("------");
            }

            var resultV2 = [];
            if (data.cveContents[target].cvss2Vector !== "") {
                var arrayVectorV2 = getSplitArray(data.cveContents[target].cvss2Vector);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[0])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[1])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[2])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[3])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[4])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[5])[1]);
            }

            var resultV3 = [];
            if (data.cveContents[target].cvss3Vector !== "") {
                var arrayVectorV3 = getSplitArray(data.cveContents[target].cvss3Vector);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[1])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[2])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[3])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[4])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[5])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[6])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[7])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[8])[1]);
            }

        } else {
            $("#scoreText_" + target).text("None").addClass("cvss-None");
            $("#scoreText_" + target + "V3").text("None").addClass("cvss-None");
            $("#summary_" + target).append("NO DATA");
            $("#summary_" + target + "V3").append("NO DATA");
            $("#lastModified_" + target).text("------");
            $("#lastModified_" + target + "V3").text("------");
        }

        if (resultV2 === undefined) {
            resultV2 = [0, 0, 0, 0, 0, 0];
        }

        if (resultV3 === undefined) {
            resultV3 = [0, 0, 0, 0, 0, 0, 0, 0];
        }

        return [resultV2, resultV3];
    }

    // ---ChartRadar
    let radarData_nvd
    let radarData_nvdV3
    let radarData_jvn
    let radarData_jvnV3
    let radarData_redhatV2
    let radarData_redhatV3

    $.each(vulsrepo.detailTaget, function(i, i_val) {
        let r = dispCvss(i_val);
        switch (i_val) {
            case "nvd":
                radarData_nvd = r[0];
                radarData_nvdV3 = r[1];
                break;
            case "jvn":
                radarData_jvn = r[0];
                radarData_jvnV3 = r[1];
                break;
            case "redhat":
                radarData_redhatV2 = r[0];
                radarData_redhatV3 = r[1];
                break;
        }

    });

    var ctxV2 = document.getElementById("radar-chartV2");
    var ctxV3 = document.getElementById("radar-chartV3");

    if (typeof chartV2 != "undefined") {
        chartV2.destroy();
    }
    if (typeof chartV3 != "undefined") {
        chartV3.destroy();
    }

    chartV2 = new Chart(ctxV2, {
        type: 'radar',
        options: {
            responsive: false,
            scale: {
                ticks: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }
        },
        data: {
            labels: ["Access Vector(AV)", "Access Complexity(AC)", "Authentication(Au)", "Confidentiality Impact(C)", "Integrity Impact(I)", "Availability Impact(A)"],
            datasets: [{
                    label: "NVD",
                    backgroundColor: "rgba(179,181,198,0.2)",
                    borderColor: "rgba(179,181,198,1)",
                    pointBackgroundColor: "rgba(179,181,198,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(179,181,198,1)",
                    hitRadius: 5,
                    data: radarData_nvd
                },
                {
                    label: "JVN",
                    backgroundColor: "rgba(255,99,132,0.2)",
                    borderColor: "rgba(255,99,132,1)",
                    pointBackgroundColor: "rgba(255,99,132,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(255,99,132,1)",
                    hitRadius: 5,
                    data: radarData_jvn
                },
                {
                    label: "RedHatV2",
                    backgroundColor: "rgba(51,204,204,0.2)",
                    borderColor: "rgba(51,204,204,1)",
                    pointBackgroundColor: "rgba(51,204,204,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(51,204,204,1)",
                    hitRadius: 5,
                    data: radarData_redhatV2
                }
            ]
        }
    });

    chartV3 = new Chart(ctxV3, {
        type: 'radar',
        options: {
            responsive: false,
            scale: {
                ticks: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }
        },
        data: {
            labels: ["Access Vector(AV)", "Access Complexity(AC)", "Privileges Required(PR)", "User Interaction(UI)", "Scope(S)", "Confidentiality Impact(C)", "Integrity Impact(I)", "Availability Impact(A)"],
            datasets: [{
                label: "NVD v3",
                backgroundColor: "rgba(179,181,198,0.2)",
                borderColor: "rgba(179,181,198,1)",
                pointBackgroundColor: "rgba(179,181,198,1)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgba(179,181,198,1)",
                hitRadius: 5,
                data: radarData_nvdV3
                },
                {
                label: "JVN v3",
                backgroundColor: "rgba(255,99,132,0.2)",
                borderColor: "rgba(255,99,132,1)",
                pointBackgroundColor: "rgba(255,99,132,1)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgba(255,99,132,1)",
                hitRadius: 5,
                data: radarData_jvnV3
                },
                {
                label: "RedHatV3",
                backgroundColor: "rgba(102,102,255,0.2)",
                borderColor: "rgba(102,102,255,1)",
                pointBackgroundColor: "rgba(102,102,255,1)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgba(102,102,255,1)",
                hitRadius: 5,
                data: radarData_redhatV3

            }]
        }
    });

    // --collapse
    // $("#summary_redhat").collapser('reInit');
    $('#summary_redhat').collapser({
        mode: 'words',
        truncate: 50
    });

    $('#summary_amazon > div').collapser({
        mode: 'words',
        truncate: 50
    });

    // ---CweID---
    if (data.cveContents.nvd !== undefined) {
        if (data.cveContents.nvd.cweIDs) {
            $("#CweID").append("<span>NVD:[" + data.cveContents.nvd.cweIDs + "] (</span>");
            $("#CweID").append("<a href=\"" + detailLink.cwe_nvd.url + data.cveContents.nvd.cweIDs[0].split("-")[1] + "\" target='_blank'>MITRE</a>");
            $("#CweID").append("<span>&nbsp;/&nbsp;</span>");
            $("#CweID").append("<a href=\"" + detailLink.cwe_jvn.url + data.cveContents.nvd.cweIDs[0] + ".html\" target='_blank'>JVN)</a>");
            $("#CweID").append("<span>&emsp;</span>");
        }
    }

    if (data.cveContents.redhat !== undefined) {
        if (data.cveContents.redhat.cweIDs !== "") {
            $("#CweID").append("<span>RedHat:[" + data.cveContents.redhat.cweIDs + "] (</span>");
            $("#CweID").append("<a href=\"" + detailLink.cwe_nvd.url + data.cveContents.redhat.cweIDs[0].split("-")[1] + "\" target='_blank'>MITRE</a>");
            $("#CweID").append("<span>&nbsp;/&nbsp;</span>");
            $("#CweID").append("<a href=\"" + detailLink.cwe_jvn.url + data.cveContents.redhat.cweIDs[0] + ".html\" target='_blank'>JVN)</a>");
        }
    }

    // ---Link---
    var addLink = function(target, url, disp) {
        $(target).append("<a href=\"" + url + "\" target='_blank'>" + disp + " </a>");
    };

    addLink("#Link", detailLink.mitre.url + "?name=" + data.cveID, detailLink.mitre.disp);
    $("#Link").append("<span> / </span>");
    addLink("#Link", detailLink.cveDetail.url + data.cveID, detailLink.cveDetail.disp);
    $("#Link").append("<span> / </span>");
    addLink("#Link", detailLink.cvssV2Calculator.url + data.cveID, detailLink.cvssV2Calculator.disp);
    $("#Link").append("<span> / </span>");
    addLink("#Link", detailLink.cvssV3Calculator.url + data.cveID, detailLink.cvssV3Calculator.disp);
    if (data.cveContents.jvn  !== undefined && data.cveContents.jvn.cvss3Vector !== undefined) {
        $("#Link").append("<span> / </span>");
        addLink("#Link", detailLink.cvssV3CalculatorJvn.url + "#" + data.cveContents.jvn.cvss3Vector, detailLink.cvssV3CalculatorJvn.disp);
    }
    $("#Link").append("<span> / </span>");
    $.each(getDistroAdvisoriesArray(data.DistroAdvisories), function(i, i_val) {
        addLink("#Link", i_val.url, i_val.disp);
    });

    addLink("#typeName_nvd", detailLink.nvd.url + data.cveID, detailLink.nvd.disp + " (v2)");
    addLink("#typeName_nvdV3", detailLink.nvd.url + data.cveID, detailLink.nvd.disp + " (v3)");
    if (data.cveContents.jvn !== undefined) {
        if (data.cveContents.jvn.jvnLink === "") {
            $("#typeName_jvn").append("<a href=\"" + detailLink.jvn.url + data.cveID + "\" target='_blank'>JVN (v2)</a>");
            $("#typeName_jvnV3").append("<a href=\"" + detailLink.jvn.url + data.cveID + "\" target='_blank'>JVN (v3)</a>");
        } else {
            $("#typeName_jvn").append("<a href=\"" + data.cveContents.jvn.sourceLink + "\" target='_blank'>JVN (v2)</a>");
            $("#typeName_jvnV3").append("<a href=\"" + data.cveContents.jvn.sourceLink + "\" target='_blank'>JVN (v3)</a>");
        }
    } else {
        $("#typeName_jvn").append("<a href=\"" + detailLink.jvn.url + data.cveID + "\" target='_blank'>JVN (v2)</a>");
        $("#typeName_jvnV3").append("<a href=\"" + detailLink.jvn.url + data.cveID + "\" target='_blank'>JVN (v3)</a>");
    }
    addLink("#typeName_redhat", detailLink.rhel.url + data.cveID, "RedHat (v2)");
    addLink("#typeName_redhatV3", detailLink.rhel.url + data.cveID, "RedHat (v3)");
    addLink("#typeName_ubuntu", detailLink.ubuntu.url + data.cveID, detailLink.ubuntu.disp);
    addLink("#typeName_debian", detailLink.debian.url + data.cveID, detailLink.debian.disp);
    addLink("#typeName_oracle", detailLink.oracle.url + data.cveID + ".html", detailLink.oracle.disp);
    if (data.cveContents.amazon !== undefined) {
        if (data.cveContents.amazon.title.indexOf('ALAS2-') != -1) {
            $("#typeName_amazon").append("<a href=\"" + detailLink.amazon.url + "AL2/" + data.cveContents.amazon.title.replace("ALAS2-", "ALAS-") + ".html\" target='_blank'>Amazon</a>");
        } else {
            // TODO Amazon Linux 1
        }
    } else {
        $("#typeName_amazon").append("Amazon");
    }

    // ---References---
    let countRef = 0;

    var addRef = function(target) {
        if (data.cveContents[target] !== undefined) {
            if (isCheckNull(data.cveContents[target].references) === false) {
                $("#References").append("<div>===" + target + "===</div>");
                $.each(data.cveContents[target].references, function(x, x_val) {
                    $("#References").append("<div>[" + x_val.source + "]<a href=\"" + x_val.link + "\" target='_blank'> (" + x_val.link + ")</a></div>");
                    countRef++;
                });
            }
        }
    }

    addRef("nvd");
    addRef("jvn");
    addRef("redhat");
    addRef("ubuntu");
    addRef("debian");
    addRef("oracle");
    addRef("amazon");
    $("#count-References").text(countRef);

    // ---Tab Package
    var pkgData = createDetailPackageData(cveID);
    packageTable.destroy();
    packageTable = $("#table-package")
        .DataTable({
            "data": pkgData,
            "fixedHeader": true,
            "retrieve": true,
            "scrollX": true,
            "autoWidth": true,
            "scrollCollapse": true,
            "columns": [{
                data: "ScanTime"
            }, {
                data: "ServerName"
            }, {
                data: "ContainerName"
            }, {
                data: "PackageName"
            }, {
                data: "PackageVersion"
            }, {
                data: "PackageRelease"
            }, {
                data: "PackageNewVersion"
            }, {
                data: "PackageNewRelease"
            }, {
                data: "NotFixedYet"
            }]
        });

    $("#table-package").find("td:contains('true')").addClass("notfixyet-true");
    $("#table-package").find("td:contains('false')").addClass("notfixyet-false");

    // ---package changelog event
    addEventDisplayChangelog();

    $("#modal-detail").modal('show');
    setTimeout(function() { packageTable.columns.adjust(); }, 200);



};

const getDistroAdvisoriesArray = function(DistroAdvisoriesData) {
    let distroAdvisoriesArray = [];
    $.each(DistroAdvisoriesData, function(x, x_val) {
        let tmp_Map = {};
        if (x_val.advisoryID.indexOf("ALAS-") != -1) {
            tmp_Map = {
                url: detailLink.amazon.url + x_val.advisoryID + ".html",
                disp: detailLink.amazon.disp,
            }
        } else if (x_val.advisoryID.indexOf("ALAS2-") != -1) {
            tmp_Map = {
                url: detailLink.amazon.url + "AL2/" + x_val.advisoryID.replace("ALAS2-", "ALAS-") + ".html",
                disp: detailLink.amazon.disp,
            }
        } else if (x_val.advisoryID.indexOf("RHSA-") != -1) {
            tmp_Map = {
                url: detailLink.rhn.url + x_val.advisoryID + ".html",
                disp: detailLink.rhn.disp,
            }
        } else if ((x_val.advisoryID.indexOf("ELSA-") != -1) | (x_val.advisoryID.indexOf("OVMSA-") != -1)) {
            tmp_Map = {
                url: detailLink.oracleErrata.url + x_val.advisoryID + ".html",
                disp: detailLink.oracleErrata.disp,
            }
        } else {
            // For cases where other distros are increased
            console.log("");
        }
        distroAdvisoriesArray.push(tmp_Map);
    });
    return distroAdvisoriesArray;
};

var scrollTop;
const addEventDisplayChangelog = function() {
    $('.lightbox').colorbox({
        inline: true,
        href: "#changelog-content",
        width: "950px",
        height: "90%",
        speed: 100,
        fadeOut: 100,
        opacity: 0.2,
        closeButton: false,
        onComplete: function() {
            displayChangelogDetail(this);
            scrollTop = $(window).scrollTop();
            $('body').addClass('noscroll').css('top', (-scrollTop) + 'px');
        },
        onClosed: function() {
            $('body').removeClass('noscroll');
            $(window).scrollTop(scrollTop);
        }
    });
}

const createDetailPackageData = function(cveID) {
    var array = [];
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        $.each(x_val.data.scannedCves, function(y, y_val) {
            if (cveID === y_val.cveID) {
                if (isCheckNull(y_val.cpeNames) === false) {
                    targets = y_val.cpeNames;
                } else if(isCheckNull(y_val.cpeURIs) === false) {
                    targets = y_val.cpeURIs;
                } else {
                    targets = y_val.affectedPackages;
                }

                $.each(targets, function(z, z_val) {
                    if (z_val.name === undefined) {
                        pkgName = z_val;
                        NotFixedYet = "None";
                    } else {
                        pkgName = z_val.name;
                        NotFixedYet = z_val.notFixedYet;
                    }

                    let tmp_Map = {
                        ScanTime: x_val.scanTime,
                        ServerName: x_val.data.serverName,
                        ContainerName: x_val.data.container.name,
                    };

                    if (pkgName.indexOf('cpe:/') != -1) {
                        tmp_Map["PackageName"] = '<a href="#contents" class="lightbox" data-cveid="' + cveID + '" data-scantime="' + x_val.scanTime + '" data-server="' + x_val.data.serverName + '" data-container="' + x_val.data.container.name + '" data-package="' + pkgName + '">' + pkgName + '</a>';
                        tmp_Map["PackageVersion"] = "";
                        tmp_Map["PackageRelease"] = "";
                        tmp_Map["PackageNewVersion"] = "";
                        tmp_Map["PackageNewRelease"] = "";
                        tmp_Map["NotFixedYet"] = "";
                    } else if (x_val.data.packages[pkgName] !== undefined) {
                        tmp_Map["PackageName"] = '<a href="#contents" class="lightbox" data-cveid="' + cveID + '" data-scantime="' + x_val.scanTime + '" data-server="' + x_val.data.serverName + '" data-container="' + x_val.data.container.name + '" data-package="' + pkgName + '">' + pkgName + '</a>';
                        tmp_Map["PackageVersion"] = x_val.data.packages[pkgName].version;
                        tmp_Map["PackageRelease"] = x_val.data.packages[pkgName].release;
                        tmp_Map["PackageNewVersion"] = x_val.data.packages[pkgName].newVersion;
                        tmp_Map["PackageNewRelease"] = x_val.data.packages[pkgName].newRelease;
                        tmp_Map["NotFixedYet"] = NotFixedYet;
                    } else {
                        return;
                    }

                    array.push(tmp_Map);
                });
            }
        });
    });
    return array;
};

const displayChangelogDetail = function(ankerData) {
    let scantime = $(ankerData).attr('data-scantime');
    let server = $(ankerData).attr('data-server');
    let container = $(ankerData).attr('data-container');
    let cveid = $(ankerData).attr('data-cveid');
    let package = $(ankerData).attr('data-package');
    let changelogInfo = getChangeLogInfo(scantime, server, container, cveid, package);

    $("#changelog-cveid, #changelog-servername, #changelog-containername, #changelog-packagename, #changelog-method, #changelog-score, #changelog-contents, #changelog-notfixedyet").empty();
    $("#changelog-cveid").append(cveid);
    $("#changelog-servername").append(server);
    $("#changelog-containername").append(container);
    $("#changelog-method").append(changelogInfo.cveidInfo.confidences[0].detectionMethod);
    $("#changelog-score").append(changelogInfo.cveidInfo.confidences[0].score);

    let getPkg = function() {
        let result;
        $.each(changelogInfo.cveidInfo.affectedPackages, function (i, i_val) {
            if (i_val.Name = package) {
                result = i_val.notFixedYet;
            };
        });
        return result;
    };

    let notFixedYet = getPkg();
    if (notFixedYet === true) {
        $("#changelog-notfixedyet").append("true").addClass("notfixyet-true");
    } else if (notFixedYet === false) {
        $("#changelog-notfixedyet").append("false").addClass("notfixyet-false");
    }

    if (isCheckNull(changelogInfo.pkgContents) !== true) {
        $("#changelog-packagename").append(pkgContents.name + "-" + pkgContents.version + "." + pkgContents.release + " => " + pkgContents.newVersion + "." + pkgContents.newRelease);
        if (changelogInfo.pkgContents.changelog.contents === "") {
            $("#changelog-contents").append("NO DATA");
        } else {
            $.each(shapeChangelog(changelogInfo.pkgContents.changelog.contents, cveid), function (y, y_val) {
                if (y_val === "") {
                    $("#changelog-contents").append("<br>");
                } else {
                    $("#changelog-contents").append("<div>" + y_val + "</div>");
                }
            });
        }
    } else {
        $("#changelog-packagename").append(package);
        $("#changelog-contents").append("NO DATA");
    }
}

const getChangeLogInfo = function(scantime, server, container, cveid, package) {
    let cveidInfo;
    let changelogContents = "";
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        if ((x_val.scanTime === scantime) && (x_val.data.serverName === server) && (x_val.data.container.name === container)) {
            $.each(x_val.data.scannedCves, function(y, y_val) {
                if (y_val.cveID === cveid) {
                    cveidInfo = y_val;
                }
            });
            pkgContents = x_val.data.packages[package];
        }
    });
    return { "cveidInfo": cveidInfo, "pkgContents": pkgContents };
};


const shapeChangelog = function(changelogContents, cveid) {
    let tmpArray = changelogContents.split("\n");
    let resultArray = [];
    let regExpTarget = new RegExp('<span class="changelog-allcveid">' + cveid + '</span>', "g");

    $.each(tmpArray, function(x, x_val) {
        let line = _.escape(x_val)
            .replace(/\s/g, "&nbsp;")
            .replace(/^(\*.+)$/g, '<span class="changelog-title">$1</span>') //for centos
            .replace(/^([a-zA-Z].+urgency=.+)$/g, '<span class="changelog-title">$1</span>') //for debian ubuntu
            .replace(/(CVE-[0-9]{4}-[0-9]+)/g, '<span class="changelog-allcveid">$1</span>')
            .replace(regExpTarget, '<span class="changelog-targetcveid">' + cveid + '</span>');

        resultArray.push(line);
    })

    return resultArray;
}

const bringToFlont = function(id) {
    var v = $('#' + id);
    v.appendTo(v.parent());
}

const toUpperFirstLetter = function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
}
