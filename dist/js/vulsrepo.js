$(document).ready(function() {
    $.each(vulsrepo_template, function(index, val) {
        localStorage.setItem("vulsrepo_pivot_conf_user_" + val.key, val.value);
    });

    setEvents();
    createFolderTree();
    db.remove("vulsrepo_pivot_conf");
    $('#drawerLeft').drawer('show');
});

var initData = function() {
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

var initPivotTable = function() {
    $.blockUI(blockUIoption);
    setTimeout(function() {
        displayPivot(vulsrepo.detailPivotData);
        setPulldown("#drop_topmenu");
        setPulldownDisplayChangeEvent("#drop_topmenu");
        filterDisp.off("pivot_conf");
        $.unblockUI(blockUIoption);
    }, 500);
};

var packageTable = $("#table-package").DataTable();
var clipboard = new Clipboard('.btn');

var db = {
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

var filterDisp = {
    on: function(labelName) {
        $(labelName).removeClass("label-info").addClass("label-warning").text("Filter ON");
    },

    off: function(labelName) {
        $(labelName).removeClass("label-warning").addClass("label-info").text("Filter OFF");
    }
};

var fadeAlert = function(target) {
    $(target).fadeIn(1000).delay(2000).fadeOut(1000);
};

var showAlert = function(code, text) {
    $("#alert_error_code").empty();
    $("#alert_responce_text").empty();
    $("#alert_error_code").append("<div>" + code + "</div>");
    $("#alert_responce_text").append("<div>" + text + "</div>");
    $("#modal-alert").modal('show');
};

var blockUIoption = {
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

var getData = function() {

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

var getSelectedFile = function() {
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

var setPulldown = function(target) {
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

var setPulldownDisplayChangeEvent = function(target) {
    $(target + ' a').on('click', function() {
        var value = db.getPivotConf($(this).attr('value'));
        db.set("vulsrepo_pivot_conf", value);
        initPivotTable();
    });
};

var setEvents = function() {

    // last tab setting
    if (db.get("vulsrepo_detailLastTab") === null) {
        db.set("vulsrepo_detailLastTab", "nvd");
    }

    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        let hrefName = e.target.href;
        switch (hrefName.split("#")[1]) {
            case "tab_nvd":
                db.set("vulsrepo_detailLastTab", "nvd");
                break;
            case "tab_jvn":
                db.set("vulsrepo_detailLastTab", "jvn");
                break;
            case "tab_oval":
                db.set("vulsrepo_detailLastTab", "oval");
                break;
        }
    });

    // file select
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

    // pivot setting
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

    // detail cveid
    $('a[href="#package-r"]').click(function() {
        setTimeout(function() { packageTable.columns.adjust(); }, 1);
    });

    displayHelpMes();

    // all setting
    $("#Setting").click(function() {
        $("#modal-setting").modal('show');
    });

    $("#modal-setting").on("hidden.bs.modal", function() {
        initData();
    });

    //// switch
    $("[name='chkAheadUrl']").bootstrapSwitch();
    $("[name='chkPivotSummary']").bootstrapSwitch();
    $("[name='chkPivotCvss']").bootstrapSwitch();
    $("[name='chkNvdUse']").bootstrapSwitch();
    $("[name='chkJvnUse']").bootstrapSwitch();
    $("[name='chkOvalUse']").bootstrapSwitch();

    if (db.get("vulsrepo_chkAheadUrl") === "true") {
        $('input[name="chkAheadUrl"]').bootstrapSwitch('state', true, true);
    }
    if (db.get("vulsrepo_chkPivotSummary") === "false") {
        $('input[name="chkPivotSummary"]').bootstrapSwitch('state', false, false);
    }
    if (db.get("vulsrepo_chkPivotCvss") === "false") {
        $('input[name="chkPivotCvss"]').bootstrapSwitch('state', false, false);
    }
    if (db.get("vulsrepo_chkNvdUse") === "false") {
        $('input[name="chkNvdUse"]').bootstrapSwitch('state', false, false);
    }
    if (db.get("vulsrepo_chkJvnUse") === "false") {
        $('input[name="chkJvnUse"]').bootstrapSwitch('state', false, false);
    }
    if (db.get("vulsrepo_chkOvalUse") === "false") {
        $('input[name="chkOvalUse"]').bootstrapSwitch('state', false, false);
    }

    $('input[name="chkAheadUrl"]').on('switchChange.bootstrapSwitch', function(event, state) {
        if (state === true) {
            db.set("vulsrepo_chkAheadUrl", "true");
        } else {
            db.remove("vulsrepo_chkAheadUrl");
        }
    });
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
    $('input[name="chkNvdUse"]').on('switchChange.bootstrapSwitch', function(event, state) {
        pairState = $('input[name="chkJvnUse"]').bootstrapSwitch('state');
        if (state === false) {
            //$('input[name="chkJvnUse"]').bootstrapSwitch('state', true, true);
            //db.remove("vulsrepo_chkJvnUse");
            db.set("vulsrepo_chkNvdUse", "false");
        } else {
            db.remove("vulsrepo_chkNvdUse");
        }
    });
    $('input[name="chkJvnUse"]').on('switchChange.bootstrapSwitch', function(event, state) {
        if (state === false) {
            //$('input[name="chkNvdUse"]').bootstrapSwitch('state', true, true);
            //db.remove("vulsrepo_chkNvdUse");
            db.set("vulsrepo_chkJvnUse", "false");
        } else {
            db.remove("vulsrepo_chkJvnUse");
        }
    });
    $('input[name="chkOvalUse"]').on('switchChange.bootstrapSwitch', function(event, state) {
        if (state === false) {
            //$('input[name="chkOvalUse"]').bootstrapSwitch('state', true, true);
            //db.remove("vulsrepo_chkOvalUse");
            db.set("vulsrepo_chkOvalUse", "false");
        } else {
            db.remove("vulsrepo_chkOvalUse");
        }
    });

    //// priority
    if (db.get("vulsrepo_pivotPriority") === null) {
        db.set("vulsrepo_pivotPriority", "NVD,JVN,OVAL");
    }
    $.each(db.get("vulsrepo_pivotPriority").split(","), function(i, i_val) {
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
            db.set("vulsrepo_pivotPriority", tmp_pri.join(","));
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

var createFolderTree = function() {

    var target;
    if (vulsrepo.demoFlag === true) {
        target = "getfilelist.json"
    } else {
        target = "getfilelist.cgi"
    }

    var tree = $("#folderTree").dynatree({
        initAjax: {
            url: "dist/cgi/" + target
        },
        ajaxDefaults: {
            cache: false,
            timeout: 5000,
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

var isCheckNull = function(o) {
    if (o === null) {
        return true;
    } else {
        if (o.length === 0) {
            return true;
        }
    }
    return false;
}

var createPivotData = function(resultArray) {

    let array = [];
    let prioltyFlag = db.get("vulsrepo_pivotPriority").split(",");
    let summaryFlag = db.get("vulsrepo_chkPivotSummary");
    let cvssFlag = db.get("vulsrepo_chkPivotCvss");

    $.each(resultArray, function(x, x_val) {
        $.each(x_val.data.KnownCves, function(y, y_val) {

            var knownValue;
            if (isCheckNull(y_val.CpeNames) === false) {
                knownValue = y_val.CpeNames;
            } else {
                knownValue = y_val.Packages;
            }

            $.each(knownValue, function(p, p_val) {
                var KnownObj = {
                    "ScanTime": x_val.scanTime,
                    "ServerName": x_val.data.ServerName,
                    "Family": x_val.data.Family,
                    "Release": x_val.data.Release,
                    "CveID": "CHK-cveid-" + y_val.CveDetail.CveID,
                };

                // if (y_val.Confidence !== undefined) {
                //     KnownObj["Confidence.Score"] = y_val.Confidence.Score;
                //     KnownObj["Confidence.DetectionMethod"] = y_val.Confidence.DetectionMethod;
                // } else {
                //     KnownObj["Confidence.Score"] = "Unknown";
                //     KnownObj["Confidence.DetectionMethod"] = "Unknown";
                // }

                if (p_val.Name !== undefined) {
                    KnownObj["Packages"] = p_val.Name;
                } else {
                    KnownObj["Packages"] = p_val;
                }


                if (y_val.CveDetail.Nvd.CweID === "" || y_val.CveDetail.Nvd.CweID === undefined) {
                    KnownObj["CweID"] = "Unknown";
                } else {
                    KnownObj["CweID"] = y_val.CveDetail.Nvd.CweID;
                }

                if (x_val.data.Platform.Name !== "") {
                    KnownObj["Platform"] = x_val.data.Platform.Name;
                } else {
                    KnownObj["Platform"] = "None";
                }

                if (x_val.data.Container.Name !== "") {
                    KnownObj["Container"] = x_val.data.Container.Name;
                } else {
                    KnownObj["Container"] = "None";
                }

                let nvdCvss = function() {
                    KnownObj["CVSS Score"] = y_val.CveDetail.Nvd.Score;
                    KnownObj["CVSS Severity"] = getSeverity(y_val.CveDetail.Nvd.Score)[0];
                    if (summaryFlag !== "false") {
                        KnownObj["Summary"] = y_val.CveDetail.Nvd.Summary;
                    }
                    if (cvssFlag !== "false") {
                        KnownObj["CVSS (AV)"] = y_val.CveDetail.Nvd.AccessVector;
                        KnownObj["CVSS (AC)"] = y_val.CveDetail.Nvd.AccessComplexity;
                        KnownObj["CVSS (Au)"] = y_val.CveDetail.Nvd.Authentication;
                        KnownObj["CVSS (C)"] = y_val.CveDetail.Nvd.ConfidentialityImpact;
                        KnownObj["CVSS (I)"] = y_val.CveDetail.Nvd.IntegrityImpact;
                        KnownObj["CVSS (A)"] = y_val.CveDetail.Nvd.AvailabilityImpact;
                    }
                };

                let jvnCvss = function() {
                    KnownObj["CVSS Score"] = y_val.CveDetail.Jvn.Score;
                    KnownObj["CVSS Severity"] = y_val.CveDetail.Jvn.Severity;
                    if (summaryFlag !== "false") {
                        KnownObj["Summary"] = y_val.CveDetail.Jvn.Title;
                    }
                    // ex) CveDetail.Jvn.Vector (AV:A/AC:H/Au:N/C:N/I:P/A:N)
                    if (cvssFlag !== "false") {
                        var arrayVector = getSplitArray(y_val.CveDetail.Jvn.Vector);
                        KnownObj["CVSS (AV)"] = getVector.jvn(arrayVector[0])[0];
                        KnownObj["CVSS (AC)"] = getVector.jvn(arrayVector[1])[0];
                        KnownObj["CVSS (Au)"] = getVector.jvn(arrayVector[2])[0];
                        KnownObj["CVSS (C)"] = getVector.jvn(arrayVector[3])[0];
                        KnownObj["CVSS (I)"] = getVector.jvn(arrayVector[4])[0];
                        KnownObj["CVSS (A)"] = getVector.jvn(arrayVector[5])[0];
                    }
                };

                let ovalCvss = function() {
                    KnownObj["CVSS Score"] = y_val.OvalDetail.Jvn.Score;
                    KnownObj["CVSS Severity"] = y_val.CveDetail.Jvn.Severity;
                    if (summaryFlag !== "false") {
                        KnownObj["Summary"] = y_val.CveDetail.Jvn.Title;
                    }
                    // ex) CveDetail.Jvn.Vector (AV:A/AC:H/Au:N/C:N/I:P/A:N)
                    if (cvssFlag !== "false") {
                        var arrayVector = getSplitArray(y_val.CveDetail.Jvn.Vector);
                        KnownObj["CVSS (AV)"] = getVector.jvn(arrayVector[0])[0];
                        KnownObj["CVSS (AC)"] = getVector.jvn(arrayVector[1])[0];
                        KnownObj["CVSS (Au)"] = getVector.jvn(arrayVector[2])[0];
                        KnownObj["CVSS (C)"] = getVector.jvn(arrayVector[3])[0];
                        KnownObj["CVSS (I)"] = getVector.jvn(arrayVector[4])[0];
                        KnownObj["CVSS (A)"] = getVector.jvn(arrayVector[5])[0];
                    }
                };

                $.each(prioltyFlag, function(i, i_val) {
                    if (i_val === "NVD") {
                        if (y_val.CveDetail.Nvd.Score !== 0) {
                            nvdCvss();
                        } else if (y_val.CveDetail.Jvn.Score !== 0) {
                            jvnCvss();
                        }
                        return false;
                    }

                    if (i_val === "JVN") {
                        if (y_val.CveDetail.Jvn.Score !== 0) {
                            jvnCvss();
                        } else if (y_val.CveDetail.Nvd.Score !== 0) {
                            nvdCvss();
                        }
                        return false;
                    }
                });

                if (p_val.Name !== undefined) {
                    KnownObj["Changelog"] = "CHK-changelog-" + y_val.CveDetail.CveID + "," + x_val.scanTime + "," + x_val.data.ServerName + "," + x_val.data.Container.Name + "," + p_val.Name;
                } else {
                    KnownObj["Changelog"] = "CHK-changelog-" + y_val.CveDetail.CveID + "," + x_val.scanTime + "," + x_val.data.ServerName + "," + x_val.data.Container.Name + "," + p_val;
                }

                array.push(KnownObj);

            });

        });

        $.each(x_val.data.UnknownCves, function(y, y_val) {

            var unknownValue;
            if (isCheckNull(y_val.CpeNames) === false) {
                unknownValue = y_val.CpeNames;
            } else {
                unknownValue = y_val.Packages;
            }

            $.each(unknownValue, function(p, p_val) {
                var UnknownObj = {
                    "ScanTime": x_val.scanTime,
                    "ServerName": x_val.data.ServerName,
                    "Family": x_val.data.Family,
                    "Release": x_val.data.Release,
                    "CveID": "CHK-cveid-" + y_val.CveDetail.CveID,
                    "CweID": "Unknown",
                    "CVSS Score": "Unknown",
                    "CVSS Severity": "Unknown"
                };

                if (summaryFlag !== "false") {
                    UnknownObj["Summary"] = "Unknown";
                }
                if (cvssFlag !== "false") {
                    UnknownObj["CVSS (AV)"] = "Unknown";
                    UnknownObj["CVSS (AC)"] = "Unknown";
                    UnknownObj["CVSS (Au)"] = "Unknown";
                    UnknownObj["CVSS (C)"] = "Unknown";
                    UnknownObj["CVSS (I)"] = "Unknown";
                    UnknownObj["CVSS (A)"] = "Unknown";
                }

                // if (y_val.Confidence !== undefined) {
                //     UnknownObj["Confidence.Score"] = y_val.Confidence.Score;
                //     UnknownObj["Confidence.DetectionMethod"] = y_val.Confidence.DetectionMethod;
                // } else {
                //     UnknownObj["Confidence.Score"] = "Unknown";
                //     UnknownObj["Confidence.DetectionMethod"] = "Unknown";
                // }

                if (p_val.Name !== undefined) {
                    UnknownObj["Packages"] = p_val.Name;
                } else {
                    UnknownObj["Packages"] = p_val;
                }

                if (x_val.data.Platform.Name !== "") {
                    UnknownObj["Platform"] = x_val.data.Platform.Name;
                } else {
                    UnknownObj["Platform"] = "None";
                }

                if (x_val.data.Container.Name !== "") {
                    UnknownObj["Container"] = x_val.data.Container.Name;
                } else {
                    UnknownObj["Container"] = "None";
                }

                if (p_val.Name !== undefined) {
                    UnknownObj["Changelog"] = "CHK-changelog-" + y_val.CveDetail.CveID + "," + x_val.scanTime + "," + x_val.data.ServerName + "," + x_val.data.Container.Name + "," + p_val.Name;
                } else {
                    UnknownObj["Changelog"] = "CHK-changelog-" + y_val.CveDetail.CveID + "," + x_val.scanTime + "," + x_val.data.ServerName + "," + x_val.data.Container.Name + "," + p_val;
                }

                array.push(UnknownObj);
            });

        });

        if ((isCheckNull(x_val.data.KnownCves) == true) && (isCheckNull(x_val.data.UnknownCves) == true)) {
            var nothingObj = {
                "ScanTime": x_val.scanTime,
                "ServerName": x_val.data.ServerName,
                "Family": x_val.data.Family,
                "Release": x_val.data.Release,
                "CveID": "healthy",
                "CweID": "healthy",
                "Packages": "healthy",
                "CVSS Score": "healthy",
                "CVSS Severity": "healthy",
                "CVSS (AV)": "healthy",
                "CVSS (AC)": "healthy",
                "CVSS (Au)": "healthy",
                "CVSS (C)": "healthy",
                "CVSS (I)": "healthy",
                "CVSS (A)": "healthy",
                // "Confidence.Score": "healthy",
                // "Confidence.DetectionMethod": "healthy"
            };

            if (summaryFlag !== "false") {
                nothingObj["Summary"] = "healthy";
            }
            if (cvssFlag !== "false") {
                nothingObj["CVSS (AV)"] = "healthy";
                nothingObj["CVSS (AC)"] = "healthy";
                nothingObj["CVSS (Au)"] = "healthy";
                nothingObj["CVSS (C)"] = "healthy";
                nothingObj["CVSS (I)"] = "healthy";
                nothingObj["CVSS (A)"] = "healthy";
            }

            if (x_val.data.Platform.Name !== "") {
                nothingObj["Platform"] = x_val.data.Platform.Name;
            } else {
                nothingObj["Platform"] = "None";
            }

            if (x_val.data.Container.Name !== "") {
                nothingObj["Container"] = x_val.data.Container.Name;
            } else {
                nothingObj["Container"] = "None";
            }

            array.push(nothingObj);
        }
    });

    console.info("PivotDataCount: " + array.length);
    return array;
};

var displayPivot = function(array) {

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
    //var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.c3_renderers, $.pivotUtilities.d3_renderers);
    var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.c3_renderers, $.pivotUtilities.export_renderers);
    var dateFormat = $.pivotUtilities.derivers.dateFormat;
    var sortAs = $.pivotUtilities.sortAs;

    var pivot_attr = {
        renderers: renderers,
        menuLimit: 3000,
        rows: ["ScanTime", "ServerName", "Container"],
        cols: ["CVSS Severity", "CVSS Score"],
        vals: [""],
        exclusions: "",
        aggregatorName: "Count",
        rendererName: "Heatmap",
        sorters: function(attr) {
            if (attr == "CVSS Severity") {
                return sortAs(["healthy", "Low", "Medium", "High", "Unknown"]);
            }

            if (attr == "CveID" || attr == "CweID" || attr == "Packages" || attr == "CVSS Score" || attr == "Summary" || attr == "CVSS (AV)" || attr == "CVSS (AC)" || attr == "CVSS (Au)" || attr == "CVSS (C)" || attr == "CVSS (I)" || attr == "CVSS(I)") {
                return sortAs(["healthy"]);
            }

        },
        onRefresh: function(config) {
            db.set("vulsrepo_pivot_conf_tmp", config);
            $("#pivot_base").find(".pvtVal[data-value='null']").css("background-color", "palegreen");
            $("#pivot_base").find("th:contains('healthy')").css("background-color", "lightskyblue");
            $("#pivot_base").find("th:contains('CveID')").css("minWidth", "110px");
            addCveIDLink();
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
        filterDisp.on("#label_pivot_conf");
    } else {
        filterDisp.off("#label_pivot_conf");
    }

    $("#pivot_base").pivotUI(array, pivot_attr, {
        overwrite: "true"
    });

};

var addCveIDLink = function() {
    let doms = $("#pivot_base").find("th:contains('CHK-cveid-')");
    doms.each(function() {
        let cveid = $(this).text().replace("CHK-cveid-", "");
        $(this).text("").append('<a class="cveid">' + cveid + '<a>');
    });

    $('.cveid').on('click', function() {
        displayDetail(this.text);
    });
};

var addChangelogLink = function() {
    let doms = $("#pivot_base").find("th:contains('CHK-changelog-')");
    doms.each(function() {
        let changelogSearch = $(this).text().replace("CHK-changelog-", "").split(",");
        $(this).text("").append('<a href="#contents" class="lightbox" data-cveid="' + changelogSearch[0] + '" data-scantime="' + changelogSearch[1] + '" data-server="' + changelogSearch[2] + '" data-container="' + changelogSearch[3] + '" data-package="' + changelogSearch[4] + '">Changelog</a>');
    });
    addEventDisplayChangelog();
};

var createDetailData = function(cveID) {
    var targetObj;
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        $.each(x_val.data.KnownCves, function(y, y_val) {
            if (cveID === y_val.CveDetail.CveID) {
                targetObj = y_val;
            }
        });

        $.each(x_val.data.UnknownCves, function(y, y_val) {
            if (cveID === y_val.CveDetail.CveID) {
                targetObj = y_val;
            }
        });
    });

    return targetObj;
};


var initDetail = function() {
    $("#modal-label").text("");
    $("#publishedDateJvn,#lastModifiedDateJvn,#publishedDateNvd,#lastModifiedDateNvd", "#publishedDateOval", "#lastModifiedDateOval").text("------");
    $("#scoreText_jvn,#scoreText_nvd,#scoreText_oval").text("").css('background-color', 'gray');
    $("#cvss_av_jvn,#cvss_ac_jvn,#cvss_au_jvn,#cvss_c_jvn,#cvss_i_jvn,#cvss_a_jvn").removeClass().text("");
    $("#cvss_av_nvd,#cvss_ac_nvd,#cvss_au_nvd,#cvss_c_nvd,#cvss_i_nvd,#cvss_a_nvd").removeClass().text("");
    $("#cvss_av_oval,#cvss_ac_oval,#cvss_au_oval,#cvss_c_oval,#cvss_i_oval,#cvss_a_oval").removeClass().text("");
    $("#detailTitle_jvn,#detailTitle_nvd,#detailTitle_oval,#Summary_jvn,#Summary_nvd,#Summary_oval,#CweID,#Link,#References").empty();
    $("#count-References").text("0");
};


var displayDetail = function(cveID) {
    initDetail();

    switch (db.get("vulsrepo_detailLastTab")) {
        case "nvd":
            $('a[href="#tab_nvd"]').tab('show');
            break;
        case "jvn":
            $('a[href="#tab_jvn"]').tab('show');
            break;
        case "oval":
            $('a[href="#tab_oval"]').tab('show');
            break;

    }

    if (db.get("vulsrepo_chkNvdUse") === "false") {
        $('a[href="#tab_nvd"]').css('display', 'none');
        $('a[href="#tab_jvn"]').tab('show');
        $('a[href="#tab_oval"]').tab('show');
    } else {
        $('a[href="#tab_nvd"]').css('display', '');
    }

    if (db.get("vulsrepo_chkJvnUse") === "false") {
        $('a[href="#tab_jvn"]').css('display', 'none');
        $('a[href="#tab_nvd"]').tab('show');
        $('a[href="#tab_oval"]').tab('show');
    } else {
        $('a[href="#tab_jvn"]').css('display', '');
    }

    if (db.get("vulsrepo_chkOvalUse") === "false") {
        $('a[href="#tab_oval"]').css('display', 'none');
        $('a[href="#tab_nvd"]').tab('show');
        $('a[href="#tab_jvn"]').tab('show');
    } else {
        $('a[href="#tab_oval"]').css('display', '');
    }

    var data = createDetailData(cveID);

    // ---Tab main
    $("#modal-label").text(data.CveID);

    // ---Tab JVN---
    if (data.CveDetail.Jvn.Summary !== "") {
        $("#publishedDateJvn").text(data.CveDetail.Jvn.PublishedDate.split("T")[0]);
        $("#lastModifiedDateJvn").text(data.CveDetail.Jvn.LastModifiedDate.split("T")[0]);

        var arrayVector = getSplitArray(data.CveDetail.Jvn.Vector);
        $("#scoreText_jvn").text(data.CveDetail.Jvn.Score + " (" + data.CveDetail.Jvn.Severity + ")").css('background-color', getSeverity(data.CveDetail.Jvn.Score)[1]);
        $("#cvss_av_jvn").text(getVector.jvn(arrayVector[0])[0]).addClass(getVector.jvn(arrayVector[0])[1]);
        $("#cvss_ac_jvn").text(getVector.jvn(arrayVector[1])[0]).addClass(getVector.jvn(arrayVector[1])[1]);
        $("#cvss_au_jvn").text(getVector.jvn(arrayVector[2])[0]).addClass(getVector.jvn(arrayVector[2])[1]);
        $("#cvss_c_jvn").text(getVector.jvn(arrayVector[3])[0]).addClass(getVector.jvn(arrayVector[3])[1]);
        $("#cvss_i_jvn").text(getVector.jvn(arrayVector[4])[0]).addClass(getVector.jvn(arrayVector[4])[1]);
        $("#cvss_a_jvn").text(getVector.jvn(arrayVector[5])[0]).addClass(getVector.jvn(arrayVector[5])[1]);
        $("#Summary_jvn").append("<div>" + data.CveDetail.Jvn.Summary + "<div>");

    } else {
        $("#scoreText_jvn").text("NO DATA");
        $("#Summary_jvn").append("NO DATA");
    }

    // ---Tab NVD---
    if (data.CveDetail.Nvd.Summary !== "") {
        $("#publishedDateNvd").text(data.CveDetail.Nvd.PublishedDate.split("T")[0]);
        $("#lastModifiedDateNvd").text(data.CveDetail.Nvd.LastModifiedDate.split("T")[0]);

        $("#scoreText_nvd").text(data.CveDetail.Nvd.Score + " (" + getSeverity(data.CveDetail.Nvd.Score)[0] + ")").css('background-color', getSeverity(data.CveDetail.Nvd.Score)[1]);
        $("#cvss_av_nvd").text(data.CveDetail.Nvd.AccessVector).addClass(getVector.nvd("AV", data.CveDetail.Nvd.AccessVector));
        $("#cvss_ac_nvd").text(data.CveDetail.Nvd.AccessComplexity).addClass(getVector.nvd("AC", data.CveDetail.Nvd.AccessComplexity));
        $("#cvss_au_nvd").text(data.CveDetail.Nvd.Authentication).addClass(getVector.nvd("Au", data.CveDetail.Nvd.Authentication));
        $("#cvss_c_nvd").text(data.CveDetail.Nvd.ConfidentialityImpact).addClass(getVector.nvd("C", data.CveDetail.Nvd.ConfidentialityImpact));
        $("#cvss_i_nvd").text(data.CveDetail.Nvd.IntegrityImpact).addClass(getVector.nvd("I", data.CveDetail.Nvd.IntegrityImpact));
        $("#cvss_a_nvd").text(data.CveDetail.Nvd.AvailabilityImpact).addClass(getVector.nvd("A", data.CveDetail.Nvd.AvailabilityImpact));
        $("#Summary_nvd").append("<div>" + data.CveDetail.Nvd.Summary + "<div>");

    } else {
        $("#scoreText_nvd").text("NO DATA");
        $("#Summary_nvd").append("NO DATA");
    }

    // ---Tab OVAL---
    if (data.CveDetail.Nvd.Summary !== "") {
        $("#publishedDateNvd").text(data.CveDetail.Nvd.PublishedDate.split("T")[0]);
        $("#lastModifiedDateNvd").text(data.CveDetail.Nvd.LastModifiedDate.split("T")[0]);

        $("#scoreText_nvd").text(data.CveDetail.Nvd.Score + " (" + getSeverity(data.CveDetail.Nvd.Score)[0] + ")").css('background-color', getSeverity(data.CveDetail.Nvd.Score)[1]);
        $("#cvss_av_nvd").text(data.CveDetail.Nvd.AccessVector).addClass(getVector.nvd("AV", data.CveDetail.Nvd.AccessVector));
        $("#cvss_ac_nvd").text(data.CveDetail.Nvd.AccessComplexity).addClass(getVector.nvd("AC", data.CveDetail.Nvd.AccessComplexity));
        $("#cvss_au_nvd").text(data.CveDetail.Nvd.Authentication).addClass(getVector.nvd("Au", data.CveDetail.Nvd.Authentication));
        $("#cvss_c_nvd").text(data.CveDetail.Nvd.ConfidentialityImpact).addClass(getVector.nvd("C", data.CveDetail.Nvd.ConfidentialityImpact));
        $("#cvss_i_nvd").text(data.CveDetail.Nvd.IntegrityImpact).addClass(getVector.nvd("I", data.CveDetail.Nvd.IntegrityImpact));
        $("#cvss_a_nvd").text(data.CveDetail.Nvd.AvailabilityImpact).addClass(getVector.nvd("A", data.CveDetail.Nvd.AvailabilityImpact));
        $("#Summary_nvd").append("<div>" + data.CveDetail.Nvd.Summary + "<div>");

    } else {
        $("#scoreText_nvd").text("NO DATA");
        $("#Summary_nvd").append("NO DATA");
    }

    // ---CweID---
    if (data.CveDetail.Nvd.CweID === "" || data.CveDetail.Nvd.CweID === undefined) {
        $("#CweID").append("<span>NO DATA</span>");
    } else {
        $("#CweID").append("<span>[" + data.CveDetail.Nvd.CweID + "] </span>");
        if (db.get("vulsrepo_chkNvdUse") !== "false") {
            $("#CweID").append("<a href=\"" + vulsrepo.link.cwe_nvd.url + data.CveDetail.Nvd.CweID.split("-")[1] + "\" target='_blank'>MITRE</a>");
            $("#CweID").append("<span> / </span>");
        }
        if (db.get("vulsrepo_chkJvnUse") !== "false") {
            $("#CweID").append("<a href=\"" + vulsrepo.link.cwe_jvn.url + data.CveDetail.Nvd.CweID + ".html\" target='_blank'>JVN</a>");
        }
    }

    // ---Link---
    addLink("#Link", vulsrepo.link.mitre.url + "?name=" + data.CveID, vulsrepo.link.mitre.disp, vulsrepo.link.mitre.find, "mitre");
    addLink("#Link", vulsrepo.link.cveDetail.url + data.CveID, vulsrepo.link.cveDetail.disp, vulsrepo.link.cveDetail.find, "cveDetail");
    addLink("#Link", vulsrepo.link.cvssV2Calculator.url + data.CveID, vulsrepo.link.cvssV2Calculator.disp, vulsrepo.link.cvssV2Calculator.find, "cvssV2Calculator");
    addLink("#Link", vulsrepo.link.cvssV3Calculator.url + data.CveID, vulsrepo.link.cvssV3Calculator.disp, vulsrepo.link.cvssV3Calculator.find, "cvssV3Calculator");
    addLink("#Link", vulsrepo.link.nvd.url + data.CveID, vulsrepo.link.nvd.disp, vulsrepo.link.nvd.find, "nvd");

    if (db.get("vulsrepo_chkJvnUse") !== "false") {
        var chkAheadUrl = db.get("vulsrepo_chkAheadUrl");
        if (data.CveDetail.Jvn.JvnLink === "") {
            $("#Link").append("<a href=\"" + vulsrepo.link.jvn.url + data.CveID + "\" target='_blank'>JVN</a>");
            if (chkAheadUrl === "true") {
                $("#Link").append("<img class='linkCheckIcon' src=\"dist/img/error.svg\"></img>");
            }

        } else {
            $("#Link").append("<a href=\"" + data.CveDetail.Jvn.JvnLink + "\" target='_blank'>JVN</a>");
            if (chkAheadUrl === "true") {
                $("#Link").append("<img class='linkCheckIcon' src=\"dist/img/ok.svg\"></img>");
            }
        }
        $("#Link").append("<span> / </span>");
    }

    addLink("#Link", vulsrepo.link.rhel.url + data.CveID, vulsrepo.link.rhel.disp, vulsrepo.link.rhel.find, "rhel");
    addLink("#Link", vulsrepo.link.debian.url + data.CveID, vulsrepo.link.debian.disp, vulsrepo.link.debian.find, "debian");
    addLink("#Link", vulsrepo.link.ubuntu.url + data.CveID, vulsrepo.link.ubuntu.disp, vulsrepo.link.ubuntu.find, "ubuntu");
    addLink("#Link", vulsrepo.link.oracle.url + data.CveID + ".html", vulsrepo.link.oracle.disp, vulsrepo.link.oracle.find, "oracle");
    $.each(getDistroAdvisoriesArray(data.DistroAdvisories), function(i, i_val) {
        addLink("#Link", i_val.url, i_val.disp, i_val.find, i_val.imgID);
    });

    // ---References---
    let countRef = 0;
    if ((isCheckNull(data.CveDetail.Nvd.References) === false) & (db.get("vulsrepo_chkNvdUse") !== "false")) {
        $("#References").append("<div>-----NVD-----</div>");
        $.each(data.CveDetail.Nvd.References, function(x, x_val) {
            $("#References").append("<div>[" + x_val.Source + "]<a href=\"" + x_val.Link + "\" target='_blank'> (" + x_val.Link + ")</a></div>");
            countRef++;
        });
    }
    if ((isCheckNull(data.CveDetail.Jvn.References) === false) & (db.get("vulsrepo_chkJvnUse") !== "false")) {
        $("#References").append("<div>-----JVN-----</div>");
        $.each(data.CveDetail.Jvn.References, function(x, x_val) {
            $("#References").append("<div>[" + x_val.Source + "]<a href=\"" + x_val.Link + "\" target='_blank'> (" + x_val.Link + ")</a></div>");
            countRef++;
        });
    }
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
            }]
        });

    // ---package changelog event
    addEventDisplayChangelog();

    $("#modal-detail").modal('show');
    setTimeout(function() { packageTable.columns.adjust(); }, 200);

};

var getDistroAdvisoriesArray = function(DistroAdvisoriesData) {
    let distroAdvisoriesArray = [];
    $.each(DistroAdvisoriesData, function(x, x_val) {
        let tmp_Map = {};
        if (x_val.AdvisoryID.indexOf("ALAS-") != -1) {
            tmp_Map = {
                url: vulsrepo.link.amazon.url + x_val.AdvisoryID + ".html",
                disp: vulsrepo.link.amazon.disp,
                find: vulsrepo.link.amazon.find,
                imgID: "amazon"
            }
        } else if (x_val.AdvisoryID.indexOf("RHSA-") != -1) {
            tmp_Map = {
                url: vulsrepo.link.rhn.url + x_val.AdvisoryID + ".html",
                disp: vulsrepo.link.rhn.disp,
                find: vulsrepo.link.rhn.find,
                imgID: "rhn"
            }
        } else if ((x_val.AdvisoryID.indexOf("ELSA-") != -1) | (x_val.AdvisoryID.indexOf("OVMSA-") != -1)) {
            tmp_Map = {
                url: vulsrepo.link.oracleErrata.url + x_val.AdvisoryID + ".html",
                disp: vulsrepo.link.oracleErrata.disp,
                find: vulsrepo.link.oracleErrata.find,
                imgID: "oracleErrata"
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
var addEventDisplayChangelog = function() {
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

var addLink = function(target, url, disp, find, imgIdTarget) {
    $(target).append("<a href=\"" + url + "\" target='_blank'>" + disp + " </a>");
    if (db.get("vulsrepo_chkAheadUrl") === "true") {
        $(target).append("<img class='linkCheckIcon' id=imgId_" + imgIdTarget + " src=\"dist/img/loading_small.gif\"></img>");
        checkLink(url, find, "#imgId_" + imgIdTarget);
    }
    $(target).append("<span> / </span>");

};

var checkLink = function(url, find, imgId) {
    if ((imgId === '#imgId_cvssV2Calculator') | (imgId === '#imgId_cvssV3Calculator') | (imgId === '#imgId_nvd')) {
        $(imgId).remove();
        return
    }

    $.ajaxSetup({
        timeout: 30 * 1000
    });
    $.get(url).done(function(data, textStatus, jqXHR) {
        // console.log("done:" + imgID);
        // console.log(data);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        // console.log("fail:" + imgId);
        // console.log(jqXHR);
    }).always(function(data, textStatus, jqXHR) {
        // console.log("always:" + imgId);
        // console.log(data);
        // console.log(textStatus);
        // console.log(jqXHR);

        var result_text = data.results[0];
        if (result_text !== undefined) {
            if (result_text.indexOf(find) !== -1) {
                $(imgId).attr("src", "dist/img/error.svg");
            } else {
                $(imgId).attr("src", "dist/img/ok.svg");
            }
        } else {
            $(imgId).attr("src", "dist/img/error.svg");
        }
    });

};


var createDetailPackageData = function(cveID) {
    var array = [];
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        $.each(x_val.data.ScannedCves, function(y, y_val) {
            if (cveID === y_val.CveID) {
                if (isCheckNull(y_val.CpeNames) === false) {
                    targets = y_val.CpeNames;
                } else {
                    targets = y_val.Packages;
                }

                $.each(targets, function(z, z_val) {
                    let tmp_Map = {
                        ScanTime: x_val.scanTime,
                        ServerName: x_val.data.ServerName,
                        ContainerName: x_val.data.Container.Name,
                    };

                    if (z_val.Name !== undefined) {
                        tmp_Map["PackageName"] = '<a href="#contents" class="lightbox" data-cveid="' + cveID + '" data-scantime="' + x_val.scanTime + '" data-server="' + x_val.data.ServerName + '" data-container="' + x_val.data.Container.Name + '" data-package="' + z_val.Name + '">' + z_val.Name + '</a>';
                        tmp_Map["PackageVersion"] = z_val.Version;
                        tmp_Map["PackageRelease"] = z_val.Release;
                        tmp_Map["PackageNewVersion"] = z_val.NewVersion;
                        tmp_Map["PackageNewRelease"] = z_val.NewRelease;

                    } else {
                        tmp_Map["PackageName"] = '<a href="#contents" class="lightbox" data-cveid="' + cveID + '" data-scantime="' + x_val.scanTime + '" data-server="' + x_val.data.ServerName + '" data-container="' + x_val.data.Container.Name + '" data-package="' + z_val + '">' + z_val + '</a>';
                        tmp_Map["PackageVersion"] = "";
                        tmp_Map["PackageRelease"] = "";
                        tmp_Map["PackageNewVersion"] = "";
                        tmp_Map["PackageNewRelease"] = "";
                    }
                    array.push(tmp_Map);
                });

            }

        });

    });
    return array;
};

var displayChangelogDetail = function(ankerData) {
    let scantime = $(ankerData).attr('data-scantime');
    let server = $(ankerData).attr('data-server');
    let container = $(ankerData).attr('data-container');
    let cveid = $(ankerData).attr('data-cveid');
    let package = $(ankerData).attr('data-package');
    let changelogInfo = getChangeLogInfo(scantime, server, container, cveid, package);

    $("#changelog-cveid, #changelog-servername, #changelog-containername, #changelog-packagename, #changelog-method, #changelog-score, #changelog-contents").empty();
    $("#changelog-cveid").append(cveid);
    $("#changelog-servername").append(server);
    $("#changelog-containername").append(container);
    $("#changelog-method").append(changelogInfo.cveidInfo.Confidence.DetectionMethod);
    $("#changelog-score").append(changelogInfo.cveidInfo.Confidence.Score);

    if (isCheckNull(changelogInfo.cveidInfo.Packages) === true) {
        $("#changelog-packagename").append(package);
    } else {
        $.each(changelogInfo.cveidInfo.Packages, function(x, x_val) {
            if (x_val.Name === package) {
                $("#changelog-packagename").append(package + "-" + x_val.Version + "." + x_val.Release + " => " + x_val.NewVersion + "." + x_val.NewRelease);
            }
        });
    }

    if (changelogInfo.changelogContents === "") {
        $("#changelog-contents").append("NO DATA");
    } else {
        $.each(shapeChangelog(changelogInfo.changelogContents, cveid), function(y, y_val) {
            if (y_val === "") {
                $("#changelog-contents").append("<br>");
            } else {
                $("#changelog-contents").append("<div>" + y_val + "</div>");
            }
        });
    }
}

var getChangeLogInfo = function(scantime, server, container, cveid, package) {
    let cveidInfo;
    let changelogContents = "";
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        if ((x_val.scanTime === scantime) && (x_val.data.ServerName === server) && (x_val.data.Container.Name === container)) {
            $.each(x_val.data.ScannedCves, function(y, y_val) {
                if (y_val.CveID === cveid) {
                    cveidInfo = y_val;
                }
            });

            $.each(x_val.data.Packages, function(z, z_val) {
                if (z_val.Name === package) {
                    changelogContents = z_val.Changelog.Contents;
                }
            });
        }
    });
    return { "cveidInfo": cveidInfo, "changelogContents": changelogContents };
};


var shapeChangelog = function(changelogContents, cveid) {
    let tmpArray = changelogContents.split("\n");
    let resultArray = [];
    let regExpTarget = new RegExp('<span class="changelog-allcveid">' + cveid + '</span>', "g");

    $.each(tmpArray, function(x, x_val) {
        let line = _.escape(x_val)
            .replace(/\s/g, "&nbsp;")
            .replace(/^(\*.+)$/g, '<span class="title-changelog">$1</span>') //for centos
            .replace(/^([a-zA-Z].+urgency=.+)$/g, '<span class="title-changelog">$1</span>') //for debian ubuntu
            .replace(/(CVE-[0-9]{4}-[0-9]+)/g, '<span class="changelog-allcveid">$1</span>')
            .replace(regExpTarget, '<span class="changelog-targetcveid">' + cveid + '</span>');

        resultArray.push(line);
    })

    return resultArray;
}

var bringToFlont = function(id) {
    var v = $('#' + id);
    v.appendTo(v.parent());
}