$(document).ready(function() {
    setEvents();
    createFolderTree();
    db.remove("vulsrepo_pivot_conf");
    $('#drawerLeft').drawer('show');
});

const initData = function() {
    $.blockUI(blockUIoption);
    getData().done(function(resultArray) {
        vulsrepo.detailRawData = resultArray; //for detailed screen
        vulsrepo.detailPivotData = createPivotData(resultArray); //for Pivot
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
        let array = [];
        for (let i = 0; i < localStorage.length; i++) {
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

    let kickCount = 0;
    let endCount = 0;
    let resultArray = [];
    let defer = new $.Deferred();

    let selectedFiles = getSelectedFile();

    if (selectedFiles.length === 0) {
        defer.reject("notSelect");
        return defer.promise();
    }

    $.each(selectedFiles, function(key, value) {
        let url = value.url;
        $.getJSON(url).done(function(json_data) {
            endCount++;
            let resultMap = {
                scanTime: value.parent_title,
                data: json_data
            };

            if (resultMap.data.JSONVersion === undefined || resultMap.data.JSONVersion !== 4) {
                showAlert("Old JSON format", value.url);
                $.unblockUI(blockUIoption);
                return;
            }

            if (resultMap.data.ReportedAt === "0001-01-01T00:00:00Z") {
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
    let selectedFile = $.map($("#folderTree").dynatree("getSelectedNodes"), function(node) {
        if (node.data.isFolder === false) {
            let data = {
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
        let value = db.getPivotConf($(this).attr('value'));
        db.set("vulsrepo_pivot_conf", value);
        initPivotTable();
    });
};


const cutStr = function(str) {
    let afterTxt = ' …';
    let textLength = str.length;

    if (vulsrepo.cutFigure > textLength) {
        return str;
    } else {
        return str.substr(0, (vulsrepo.cutFigure)) + afterTxt;
    }
};

const setEvents = function() {

    $.each(template, function(index, val) {
        localStorage.setItem("vulsrepo_pivot_conf_user_" + val.key, val.value);
    });

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
        let configName;
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

    if (db.get("vulsrepo_setting_PlatformName") === "true") {
        $("#setting_PlatformName").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_PlatformInstanceID") === "true") {
        $("#setting_PlatformInstanceID").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_IPv4Addrs") === "true") {
        $("#setting_IPv4Addrs").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_ServerUUID") === "true") {
        $("#setting_ServerUUID").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_ContainerName") === "true") {
        $("#setting_ContainerName").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_ContainerImage") === "true") {
        $("#setting_ContainerImage").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_ContainerType") === "true") {
        $("#setting_ContainerType").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_ContainerUUID") === "true") {
        $("#setting_ContainerUUID").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_cvssV2") === "true") {
        $("#setting_cvssV2").prop("checked", true);
    }

    if (db.get("vulsrepo_setting_cvssV3") === "true") {
        $("#setting_cvssV3").prop("checked", true);
    }

    $("#setting_PlatformName").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_PlatformName", "true");
        } else {
            db.remove("vulsrepo_setting_PlatformName");
        }
    });

    $("#setting_PlatformInstanceID").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_PlatformInstanceID", "true");
        } else {
            db.remove("vulsrepo_setting_PlatformInstanceID");
        }
    });

    $("#setting_IPv4Addrs").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_IPv4Addrs", "true");
        } else {
            db.remove("vulsrepo_setting_IPv4Addrs");
        }
    });

    $("#setting_ServerUUID").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_ServerUUID", "true");
        } else {
            db.remove("vulsrepo_setting_ServerUUID");
        }
    });

    $("#setting_ContainerName").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_ContainerName", "true");
        } else {
            db.remove("vulsrepo_setting_ContainerName");
        }
    });

    $("#setting_ContainerImage").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_ContainerImage", "true");
        } else {
            db.remove("vulsrepo_setting_ContainerImage");
        }
    });

    $("#setting_ContainerType").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_ContainerType", "true");
        } else {
            db.remove("vulsrepo_setting_ContainerType");
        }
    });

    $("#setting_ContainerUUID").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_ContainerUUID", "true");
        } else {
            db.remove("vulsrepo_setting_ContainerUUID");
        }
    });

    $("#setting_CvssV2").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_CvssV2", "true");
        } else {
            db.remove("vulsrepo_setting_CvssV2");
        }
    });

    $("#setting_CvssV3").click(function() {
        if ($(this).prop('checked') === true) {
            db.set("vulsrepo_setting_CvssV3", "true");
        } else {
            db.remove("vulsrepo_setting_CvssV3");
        }
    });

    // ---priority
    let priority = db.get("vulsrepo_setting_Priority");
    if ((priority === null) || (Array.isArray(priority) === false) || (priority.length !== 8)) {
        db.set("vulsrepo_setting_Priority", vulsrepo.detailTaget);
    }

    $.each(db.get("vulsrepo_setting_Priority"), function(i, i_val) {
        $("#setting_Priority").append('<li class="ui-state-default"><span class="fa fa-arrows-v" aria-hidden="true"></span>' + i_val + '</li>');
    });
    $('#setting_Priority').sortable({
        tolerance: "pointer",
        distance: 1,
        cursor: "move",
        revert: 100,
        placeholder: "placeholder",
        update: function() {
            let tmp_pri = [];
            $("#setting_Priority li").each(function(index) {
                tmp_pri.push($(this).text());
            });
            db.set("vulsrepo_setting_Priority", tmp_pri);
        }
    });
    $('#setting_Priority').disableSelection();

    $("#pivot-link").click(function() {
        let str = location.href + "?vulsrepo_pivot_conf_tmp=" + LZString.compressToEncodedURIComponent(localStorage.getItem("vulsrepo_pivot_conf_tmp"));
        $("#view_url_box").val("");
        $("#view_url_box").val(str);
        $("#modal-viewUrl").modal('show');
    });

};

const createFolderTree = function() {

    let target;
    if (vulsrepo.demoFlag === true) {
        target = "getfilelist.json"
    } else {
        target = "getfilelist"
    }

    let tree = $("#folderTree").dynatree({
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

const isCheckNone = function(o) {
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

    const flagPlatformName = db.get("vulsrepo_setting_PlatformName");
    const flagPlatformInstanceID = db.get("vulsrepo_setting_PlatformInstanceID");
    const flagIPv4Addrs = db.get("vulsrepo_setting_IPv4Addrs");
    const flagServerUUID = db.get("vulsrepo_setting_ServerUUID");
    const flagContainerName = db.get("vulsrepo_setting_ContainerName");
    const flagContainerImage = db.get("vulsrepo_setting_ContainerImage");
    const flagContainerType = db.get("vulsrepo_setting_ContainerType");
    const flagContainerUUID = db.get("vulsrepo_setting_ContainerUUID");
    const flagCvssV2 = db.get("vulsrepo_setting_CvssV2");
    const flagCvssV3 = db.get("vulsrepo_setting_CvssV3");
    const flagPriolty = db.get("vulsrepo_setting_Priority");

    let result = {};

    let addColumn = function(resultName, insertData, flagName) {
        if (flagName !== "") {
            if (isCheckNone(insertData)) {
                result[resultName] = "None";
            } else {
                result[resultName] = insertData;
            }
        }
    }

    $.each(resultArray, function(x, x_val) {
        if (isCheckNone(x_val.data.ScannedCves)) {
            let result = {
                "ScanTime": x_val.scanTime,
                "Family": x_val.data.Family,
                "Release": x_val.data.Release,
                "CveID": "healthy",
                "Packages": "healthy",
                "NotFixedYet": "healthy",
                "PackageVer": "healthy",
                "NewPackageVer": "healthy",
                "CweID": "healthy",
                "CVSS Score": "healthy",
                "CVSS Severity": "healthy",
                "Changelog": "healthy",
                "DetectionMethod": "healthy",
                "Summary": "healthy"
            };

            if (x_val.data.RunningKernel.RebootRequired === true) {
                result["ServerName"] = x_val.data.ServerName + " [Reboot Required]";
            } else {
                result["ServerName"] = x_val.data.ServerName;
            }

            if (isCheckNone(flagPlatformName) === false) {
                if (isCheckNone(x_val.data.Platform.Name)) {
                    result["PlatformName"] = "None";
                } else {
                    result["PlatformName"] = x_val.data.Platform.Name;
                }
            }

            if (isCheckNone(flagPlatformInstanceID) === false) {
                if (isCheckNone(x_val.data.Platform.InstanceID)) {
                    result["PlatformInstanceID"] = "None";
                } else {
                    result["PlatformInstanceID"] = x_val.data.Platform.InstanceID;
                }
            }

            if (isCheckNone(flagIPv4Addrs) === false) {
                if (isCheckNone(x_val.data.IPv4Addrs)) {
                    result["IPv4Addrs"] = "None";
                } else {
                    result["IPv4Addrs"] = x_val.data.IPv4Addrs.join(", ");
                }
            }

            if (isCheckNone(flagServerUUID) === false) {
                if (isCheckNone(x_val.data.ServerUUID)) {
                    result["ServerUUID"] = "None";
                } else {
                    result["ServerUUID"] = x_val.data.ServerUUID;
                }
            }

            if (x_val.data.Container.Name !== "") {
                result["Container"] = x_val.data.Container.Name;
            } else {
                result["Container"] = "None";
            }


            if (flagCvssV2 === "true") {
                result["CvssV2 (AV)"] = "healthy";
                result["CvssV2 (AC)"] = "healthy";
                result["CvssV2 (Au)"] = "healthy";
                result["CvssV2 (C)"] = "healthy";
                result["CvssV2 (I)"] = "healthy";
                result["CvssV2 (A)"] = "healthy";
            }

            if (flagCvssV3 === "true") {
                result["CvssV3 (AV)"] = "healthy";
                result["CvssV3 (AC)"] = "healthy";
                result["CvssV3 (PR)"] = "healthy";
                result["CvssV3 (UI)"] = "healthy";
                result["CvssV3 (S)"] = "healthy";
                result["CvssV3 (C)"] = "healthy";
                result["CvssV3 (I)"] = "healthy";
                result["CvssV3 (A)"] = "healthy";
            }


            array.push(result);
        } else {
            $.each(x_val.data.ScannedCves, function(y, y_val) {
                let targetNames;
                if (isCheckNone(y_val.CpeNames)) {
                    targetNames = y_val.AffectedPackages;
                } else {
                    targetNames = y_val.CpeNames;
                }

                cveid_count = cveid_count + 1
                $.each(targetNames, function(p, p_val) {
                    let pkgName;
                    let NotFixedYet;
                    if (isCheckNone(p_val.Name)) {
                        pkgName = p_val; // for CPE
                        NotFixedYet = "Unknown";
                    } else {
                        pkgName = p_val.Name;
                        NotFixedYet = p_val.NotFixedYet;
                    }

                    let pkgInfo = x_val.data.Packages[pkgName];
                    if ((pkgName.indexOf('cpe:/') === -1) && (isCheckNone(pkgInfo))) {
                        return;
                    }


                    // let result = {
                    //     "ScanTime": x_val.scanTime,
                    //     "Family": x_val.data.Family,
                    //     "Release": x_val.data.Release,
                    //     "CveID": "CHK-cveid-" + y_val.CveID,
                    //     "Packages": pkgName,
                    //     "NotFixedYet": NotFixedYet,
                    // };

                    addColumn("", "ScanTime", x_val.scanTime)

                    if (x_val.data.RunningKernel.RebootRequired === true) {
                        result["ServerName"] = x_val.data.ServerName + " [Reboot Required]";
                    } else {
                        result["ServerName"] = x_val.data.ServerName;
                    }

                    if (isCheckNone(flagPlatformName) === false) {
                        if (isCheckNone(x_val.data.Platform.Name)) {
                            result["PlatformName"] = "None";
                        } else {
                            result["PlatformName"] = x_val.data.Platform.Name;
                        }
                    }

                    if (isCheckNone(flagPlatformInstanceID) === false) {
                        if (isCheckNone(x_val.data.Platform.InstanceID)) {
                            result["PlatformInstanceID"] = "None";
                        } else {
                            result["PlatformInstanceID"] = x_val.data.Platform.InstanceID;
                        }
                    }

                    if (isCheckNone(flagIPv4Addrs) === false) {
                        if (isCheckNone(x_val.data.IPv4Addrs)) {
                            result["IPv4Addrs"] = "None";
                        } else {
                            result["IPv4Addrs"] = x_val.data.IPv4Addrs.join(", ");
                        }
                    }

                    if (isCheckNone(flagServerUUID) === false) {
                        if (isCheckNone(x_val.data.ServerUUID)) {
                            result["ServerUUID"] = "None";
                        } else {
                            result["ServerUUID"] = x_val.data.ServerUUID;
                        }
                    }

                    if (isCheckNone(flagContainerName) === false) {
                        if (isCheckNone(x_val.data.Container.Name)) {
                            result["ContainerName"] = "None";
                        } else {
                            result["ContainerName"] = x_val.data.Container.Name;
                        }
                    }

                    if (isCheckNone(flagContainerImage) === false) {
                        if (isCheckNone(x_val.data.Container.Image)) {
                            result["ContainerImage"] = "None";
                        } else {
                            result["ContainerImage"] = x_val.data.Container.Image;
                        }
                    }


                    result["DetectionMethod"] = y_val.Confidence.DetectionMethod;
                    result["Changelog"] = "CHK-changelog-" + y_val.CveID + "," + x_val.scanTime + "," + x_val.data.ServerName + "," + x_val.data.Container.Name + "," + pkgName;

                    if (isCheckNone(pkgInfo)) {
                        // ===for cpe
                        result["PackageVer"] = "Unknown";
                        result["NewPackageVer"] = "Unknown";
                    } else {
                        if (isCheckNone(pkgInfo.Version)) {
                            result["PackageVer"] = "None";
                        } else {
                            result["PackageVer"] = pkgInfo.Version + "-" + pkgInfo.Release;
                        }

                        if (isCheckNone(pkgInfo.NewVersion)) {
                            result["NewPackageVer"] = "None";
                        } else {
                            result["NewPackageVer"] = pkgInfo.NewVersion + "-" + pkgInfo.NewRelease;
                        }
                    }


                    let getCvss = function(target) {

                        if (isCheckNone(y_val.CveContents[target])) {
                            return false;
                        }

                        result["Summary"] = cutStr(y_val.CveContents[target].Summary);

                        if (isCheckNone(y_val.CveContents[target].CweIDs)) {
                            result["CweIDs"] = "None";
                        } else {
                            result["CweIDs"] = y_val.CveContents[target].CweIDs.join(',');
                        }

                        if (y_val.CveContents[target].Cvss2Score === 0 & y_val.CveContents[target].Cvss3Score === 0) {
                            return false;
                        }

                        if (y_val.CveContents[target].Cvss2Score !== 0) {
                            result["CVSS Score"] = y_val.CveContents[target].Cvss2Score;
                            result["CVSS Severity"] = getSeverityV2(y_val.CveContents[target].Cvss2Score);
                            result["CVSS Score Type"] = target;
                        } else if (y_val.CveContents[target].Cvss3Score !== 0) {
                            result["CVSS Score"] = y_val.CveContents[target].Cvss3Score;
                            result["CVSS Severity"] = getSeverityV3(y_val.CveContents[target].Cvss3Score);
                            result["CVSS Score Type"] = target + "V3";
                        }

                        if (flagCvssV2 === "true") {
                            if (y_val.CveContents[target].Cvss2Vector !== "") {
                                let arrayVector = splitVectorString(y_val.CveContents[target].Cvss2Vector);
                                result["CvssV2 (AV)"] = getVectorV2.cvss(arrayVector[0])[0];
                                result["CvssV2 (AC)"] = getVectorV2.cvss(arrayVector[1])[0];
                                result["CvssV2 (Au)"] = getVectorV2.cvss(arrayVector[2])[0];
                                result["CvssV2 (C)"] = getVectorV2.cvss(arrayVector[3])[0];
                                result["CvssV2 (I)"] = getVectorV2.cvss(arrayVector[4])[0];
                                result["CvssV2 (A)"] = getVectorV2.cvss(arrayVector[5])[0];
                            } else {
                                result["CvssV2 (AV)"] = "Unknown";
                                result["CvssV2 (AC)"] = "Unknown";
                                result["CvssV2 (Au)"] = "Unknown";
                                result["CvssV2 (C)"] = "Unknown";
                                result["CvssV2 (I)"] = "Unknown";
                                result["CvssV2 (A)"] = "Unknown";
                            }
                        }

                        if (flagCvssV3 === "true") {
                            if (y_val.CveContents[target].Cvss3Vector !== "") {
                                let arrayVector = splitVectorString(y_val.CveContents[target].Cvss3Vector);
                                result["CvssV3 (AV)"] = getVectorV3.cvss(arrayVector[1])[0];
                                result["CvssV3 (AC)"] = getVectorV3.cvss(arrayVector[2])[0];
                                result["CvssV3 (PR)"] = getVectorV3.cvss(arrayVector[3])[0];
                                result["CvssV3 (UI)"] = getVectorV3.cvss(arrayVector[4])[0];
                                result["CvssV3 (S)"] = getVectorV3.cvss(arrayVector[5])[0];
                                result["CvssV3 (C)"] = getVectorV3.cvss(arrayVector[6])[0];
                                result["CvssV3 (I)"] = getVectorV3.cvss(arrayVector[7])[0];
                                result["CvssV3 (A)"] = getVectorV3.cvss(arrayVector[8])[0];
                            } else {
                                result["CvssV3 (AV)"] = "Unknown";
                                result["CvssV3 (AC)"] = "Unknown";
                                result["CvssV3 (PR)"] = "Unknown";
                                result["CvssV3 (UI)"] = "Unknown";
                                result["CvssV3 (S)"] = "Unknown";
                                result["CvssV3 (C)"] = "Unknown";
                                result["CvssV3 (I)"] = "Unknown";
                                result["CvssV3 (A)"] = "Unknown";
                            }
                        }

                        return true;
                    };

                    let flag = false;
                    $.each(flagPriolty, function(i, i_val) {
                        if (flag !== true) {
                            flag = getCvss(i_val);
                        }
                    });

                    if (flag === false) {
                        result["CweIDs"] = "Unknown";
                        result["CVSS Score"] = "Unknown";
                        result["CVSS Severity"] = "Unknown";
                        result["CVSS Score Type"] = "Unknown";
                        result["Summary"] = "Unknown";


                        if (flagCvssV2 === "true") {
                            result["CvssV2 (AV)"] = "Unknown";
                            result["CvssV2 (AC)"] = "Unknown";
                            result["CvssV2 (Au)"] = "Unknown";
                            result["CvssV2 (C)"] = "Unknown";
                            result["CvssV2 (I)"] = "Unknown";
                            result["CvssV2 (A)"] = "Unknown";
                        }

                        if (flagCvssV3 === "true") {
                            result["CvssV3 (AV)"] = "Unknown";
                            result["CvssV3 (AC)"] = "Unknown";
                            result["CvssV3 (PR)"] = "Unknown";
                            result["CvssV3 (UI)"] = "Unknown";
                            result["CvssV3 (S)"] = "Unknown";
                            result["CvssV3 (C)"] = "Unknown";
                            result["CvssV3 (I)"] = "Unknown";
                            result["CvssV3 (A)"] = "Unknown";
                        }

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

    let url_param;
    if (location.search !== "") {
        try {
            let decode_str = LZString.decompressFromEncodedURIComponent(location.search.substring(1).split('=')[1])
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

    let url = window.location.href
    let new_url = url.replace(/\?.*$/, "");
    history.replaceState(null, null, new_url);


    let derivers = $.pivotUtilities.derivers;
    let renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.c3_renderers);
    let dateFormat = $.pivotUtilities.derivers.dateFormat;
    let sortAs = $.pivotUtilities.sortAs;

    let pivot_attr = {
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
        sorters: function(attr) {
            if (attr == "CVSS Severity") {
                return sortAs(["healthy", "Low", "Medium", "High", "Critical", "Unknown"]);
            }

            if (attr == "CveID" || attr == "CweID" || attr == "Packages" || attr == "CVSS Score" || attr == "Summary" || attr == "CVSS (AV)" || attr == "CVSS (AC)" || attr == "CVSS (Au)" || attr == "CVSS (C)" || attr == "CVSS (I)" || attr == "CVSS(I)") {
                return sortAs(["healthy"]);
            }

        },
        onRefresh: function(config) {
            db.set("vulsrepo_pivot_conf_tmp", config);
            $("#pivot_base").find(".pvtVal[data-value='null']").css("background-color", "#b2f3b2");

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
            addCveIDLink();
            addChangelogLink();
        }

    };

    let pivot_obj;
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

const addCveIDLink = function() {
    let doms = $("#pivot_base").find("th:contains('CHK-cveid-')");
    doms.each(function() {
        let cveid = $(this).text().replace("CHK-cveid-", "");
        $(this).text("").append('<a class="cveid">' + cveid + '<a>');
    });

    $('.cveid').on('click', function() {
        displayDetail(this.text);
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
    let targetObj = { CveContents: {} };
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        tmpCve = x_val.data.ScannedCves[cveID];
        if (tmpCve !== undefined) {
            targetObj["CveID"] = cveID;
            targetObj["DistroAdvisories"] = tmpCve.DistroAdvisories;
            $.each(vulsrepo.detailTaget, function(i, i_val) {
                if (tmpCve.CveContents[i_val] !== undefined) {
                    targetObj.CveContents[i_val] = tmpCve.CveContents[i_val];
                }
            });
        }
    });

    return targetObj;
};


const initDetail = function() {
    $("#modal-label").text("");
    $("#count-References").text("0");
    $("#CweID,#Link,#References,#radar-caluclatorV2,#radar-caluclatorV3").empty();

    $.each(vulsrepo.detailTaget, function(i, i_val) {
        $("#typeName_" + i_val).empty();
        $("#typeName_" + i_val + "V3").empty();
        $("#scoreText_" + i_val).text("").removeClass().addClass("tr-score tr-center");
        $("#scoreText_" + i_val + "V3").text("").removeClass().addClass("tr-score tr-center");
        $("#summary_" + i_val).empty();
        $("#lastModified_" + i_val).empty();
    });
};


let chartV2;
let chartV3;

const displayDetail = function(cveID) {
    initDetail();
    let data = createDetailData(cveID);

    // ---CVSS Detail
    $("#modal-label").text(data.CveID);


    let dispCvss = function(target) {
        let resultV2 = [];
        let resultV3 = [];

        if (data.CveContents[target] !== undefined) {
            let scoreV2 = data.CveContents[target].Cvss2Score;
            let scoreV3 = data.CveContents[target].Cvss3Score;
            let severityV2 = toUpperFirstLetter(data.CveContents[target].Cvss2Severity);
            let severityV3 = toUpperFirstLetter(data.CveContents[target].Cvss3Severity);

            if (target === "nvd") {

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

            if (target === "ubuntu" || target === "debian") {
                $("#scoreText_" + target).text(severity).addClass("cvss-" + severity);
            }

            if (isCheckNone(data.CveContents[target].Summary) === false) {
                $("#summary_" + target).append("<div>" + data.CveContents[target].Summary + "<div>");
            }

            if (data.CveContents[target].LastModified !== "0001-01-01T00:00:00Z") {
                $("#lastModified_" + target).text(data.CveContents[target].LastModified.split("T")[0]);
            } else {
                $("#lastModified_" + target).text("------");
            }

            if (isCheckNone(data.CveContents[target].Cvss2Vector) === false) {
                let arrayVectorV2 = getSplitArray(data.CveContents[target].Cvss2Vector);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[0])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[1])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[2])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[3])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[4])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[5])[1]);
            }

            if (isCheckNone(data.CveContents[target].Cvss3Vector) === false) {
                let arrayVectorV3 = getSplitArray(data.CveContents[target].Cvss3Vector);
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

        if (isCheckNone(resultV2)) {
            resultV2 = [0, 0, 0, 0, 0, 0];
        }

        if (isCheckNone(resultV3)) {
            resultV3 = [0, 0, 0, 0, 0, 0, 0, 0];
        }

        return [resultV2, resultV3];
    }



    // ---ChartRadar
    let radarData_nvdV2
    let radarData_nvdV3
    let radarData_jvnV2
    let radarData_jvnV3
    let radarData_redhatV2
    let radarData_redhatV3

    $.each(vulsrepo.detailTaget, function(i, i_val) {
        let r = dispCvss(i_val);
        switch (i_val) {
            case "nvdjson":
                radarData_nvdV2 = r[0];
                radarData_nvdV3 = r[1];
                break;
            case "nvd":
                radarData_nvdV2 = r[0];
                break;
            case "jvn":
                radarData_jvnV2 = r[0];
                radarData_jvnV3 = r[1];
                break;
            case "redhat":
                radarData_redhatV2 = r[0];
                radarData_redhatV3 = r[1];
                break;
        }
    });

    let ctxV2 = document.getElementById("radar-chartV2");
    let ctxV3 = document.getElementById("radar-chartV3");

    if (isCheckNone(chartV2) === false) {
        chartV2.destroy();
    }
    if (isCheckNone(chartV3) === false) {
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
                    label: "NVD V2",
                    backgroundColor: "rgba(179,181,198,0.2)",
                    borderColor: "rgba(179,181,198,1)",
                    pointBackgroundColor: "rgba(179,181,198,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(179,181,198,1)",
                    hitRadius: 5,
                    data: radarData_nvdV2
                },
                {
                    label: "JVN V2",
                    backgroundColor: "rgba(255,99,132,0.2)",
                    borderColor: "rgba(255,99,132,1)",
                    pointBackgroundColor: "rgba(255,99,132,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(255,99,132,1)",
                    hitRadius: 5,
                    data: radarData_jvnV2
                },
                {
                    label: "RedHat V2",
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
                    label: "NVD V3",
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
                    label: "JVN V3",
                    backgroundColor: "rgba(255,99,132,0.2)",
                    borderColor: "rgba(255,99,132,1)",
                    pointBackgroundColor: "rgba(255,99,132,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(255,99,132,1)",
                    hitRadius: 5,
                    data: radarData_jvnV3
                }, {
                    label: "RedHat V3",
                    backgroundColor: "rgba(102,102,255,0.2)",
                    borderColor: "rgba(102,102,255,1)",
                    pointBackgroundColor: "rgba(102,102,255,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(102,102,255,1)",
                    hitRadius: 5,
                    data: radarData_redhatV3
                }
            ]
        }
    });

    // --collapse
    // $("#summary_redhat").collapser('reInit');
    $('#summary_redhat').collapser({
        mode: 'words',
        truncate: 50
    });


    // ---CweID---
    // if (isCheckNone(data.CveContents.nvd) === false) {
    //     if (isCheckNone(data.CveContents.nvd.CweIDs) === false) {
    //         $("#CweID").append("<span>NVD:[" + data.CveContents.nvd.CweID + "] (</span>");
    //         $("#CweID").append("<a href=\"" + detailLink.cwe_nvd.url + data.CveContents.nvd.CweIDs.split("-")[1] + "\" target='_blank'>MITRE</a>");
    //         $("#CweID").append("<span>&nbsp;/&nbsp;</span>");
    //         $("#CweID").append("<a href=\"" + detailLink.cwe_jvn.url + data.CveContents.nvd.CweIDs + ".html\" target='_blank'>JVN)</a>");
    //         $("#CweID").append("<span>&emsp;</span>");
    //     }
    // }

    // if (data.CveContents.redhat !== undefined) {
    //     if (data.CveContents.redhat.CweID !== "") {
    //         $("#CweID").append("<span>RedHat:[" + data.CveContents.redhat.CweID + "] (</span>");
    //         $("#CweID").append("<a href=\"" + detailLink.cwe_nvd.url + data.CveContents.redhat.CweID.split("-")[1] + "\" target='_blank'>MITRE</a>");
    //         $("#CweID").append("<span>&nbsp;/&nbsp;</span>");
    //         $("#CweID").append("<a href=\"" + detailLink.cwe_jvn.url + data.CveContents.redhat.CweID + ".html\" target='_blank'>JVN)</a>");
    //     }
    // }





    // ---Link---
    let addLink = function(target, url, disp) {
        $(target).append("<a href=\"" + url + "\" target='_blank'>" + disp + " </a>");
    };

    addLink("#Link", detailLink.mitre.url + "?name=" + data.CveID, detailLink.mitre.disp);
    $("#Link").append("<span> / </span>");
    addLink("#Link", detailLink.cveDetail.url + data.CveID, detailLink.cveDetail.disp);
    $("#Link").append("<span> / </span>");
    $.each(getDistroAdvisoriesArray(data.DistroAdvisories), function(i, i_val) {
        addLink("#Link", i_val.url, i_val.disp);
    });

    addLink("#typeName_nvd", detailLink.nvd.url + data.CveID, "NVD");

    if (isCheckNone(data.CveContents.jvn) === false) {
        if (isCheckNone(data.CveContents.jvn.JvnLink) === false) {
            $("#typeName_jvn").append("<a href=\"" + detailLink.jvn.url + data.CveID + "\" target='_blank'>JVN</a>");
        } else {
            $("#typeName_jvn").append("<a href=\"" + data.CveContents.jvn.SourceLink + "\" target='_blank'>JVN</a>");
        }
    } else {
        $("#typeName_jvn").append("<a href=\"" + detailLink.jvn.url + data.CveID + "\" target='_blank'>JVN</a>");
    }
    addLink("#typeName_redhat", detailLink.rhel.url + data.CveID, "RedHat");
    addLink("#typeName_ubuntu", detailLink.ubuntu.url + data.CveID, detailLink.ubuntu.disp);
    addLink("#typeName_debian", detailLink.debian.url + data.CveID, detailLink.debian.disp);
    addLink("#typeName_oracle", detailLink.oracle.url + data.CveID + ".html", detailLink.oracle.disp);

    addLink("#radar-caluclatorV2", detailLink.cvssV2Calculator.url + data.CveID, detailLink.cvssV2Calculator.disp);
    addLink("#radar-caluclatorV3", detailLink.cvssV3Calculator.url + data.CveID, detailLink.cvssV3Calculator.disp);

    // ---References---
    let countRef = 0;

    let addRef = function(target) {
        if (data.CveContents[target] !== undefined) {
            if (isCheckNone(data.CveContents[target].References) === false) {
                $("#References").append("<div>===" + target + "===</div>");
                $.each(data.CveContents[target].References, function(x, x_val) {
                    $("#References").append("<div>[" + x_val.Source + "]<a href=\"" + x_val.Link + "\" target='_blank'> (" + x_val.Link + ")</a></div>");
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
    $("#count-References").text(countRef);

    // ---Tab Package
    let pkgData = createDetailPackageData(cveID);
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
        if (x_val.AdvisoryID.indexOf("ALAS-") != -1) {
            tmp_Map = {
                url: detailLink.amazon.url + x_val.AdvisoryID + ".html",
                disp: detailLink.amazon.disp,
            }
        } else if (x_val.AdvisoryID.indexOf("RHSA-") != -1) {
            tmp_Map = {
                url: detailLink.rhn.url + x_val.AdvisoryID + ".html",
                disp: detailLink.rhn.disp,
            }
        } else if ((x_val.AdvisoryID.indexOf("ELSA-") != -1) | (x_val.AdvisoryID.indexOf("OVMSA-") != -1)) {
            tmp_Map = {
                url: detailLink.oracleErrata.url + x_val.AdvisoryID + ".html",
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

let scrollTop;
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
    let array = [];
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        $.each(x_val.data.ScannedCves, function(y, y_val) {
            if (cveID === y_val.CveID) {
                if (isCheckNone(y_val.CpeNames) === false) {
                    targets = y_val.CpeNames;
                } else {
                    targets = y_val.AffectedPackages;
                }

                $.each(targets, function(z, z_val) {
                    if (z_val.Name === undefined) {
                        pkgName = z_val;
                        NotFixedYet = "None";
                    } else {
                        pkgName = z_val.Name;
                        NotFixedYet = z_val.NotFixedYet;
                    }

                    let tmp_Map = {
                        ScanTime: x_val.scanTime,
                        ServerName: x_val.data.ServerName,
                        ContainerName: x_val.data.Container.Name,
                    };


                    if (pkgName.indexOf('cpe:/') != -1) {
                        tmp_Map["PackageName"] = '<a href="#contents" class="lightbox" data-cveid="' + cveID + '" data-scantime="' + x_val.scanTime + '" data-server="' + x_val.data.ServerName + '" data-container="' + x_val.data.Container.Name + '" data-package="' + pkgName + '">' + pkgName + '</a>';
                        tmp_Map["PackageVersion"] = "";
                        tmp_Map["PackageRelease"] = "";
                        tmp_Map["PackageNewVersion"] = "";
                        tmp_Map["PackageNewRelease"] = "";
                        tmp_Map["NotFixedYet"] = "";
                    } else if (x_val.data.Packages[pkgName] !== undefined) {
                        tmp_Map["PackageName"] = '<a href="#contents" class="lightbox" data-cveid="' + cveID + '" data-scantime="' + x_val.scanTime + '" data-server="' + x_val.data.ServerName + '" data-container="' + x_val.data.Container.Name + '" data-package="' + pkgName + '">' + pkgName + '</a>';
                        tmp_Map["PackageVersion"] = x_val.data.Packages[pkgName].Version;
                        tmp_Map["PackageRelease"] = x_val.data.Packages[pkgName].Release;
                        tmp_Map["PackageNewVersion"] = x_val.data.Packages[pkgName].NewVersion;
                        tmp_Map["PackageNewRelease"] = x_val.data.Packages[pkgName].NewRelease;
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
    $("#changelog-method").append(changelogInfo.cveidInfo.Confidence.DetectionMethod);
    $("#changelog-score").append(changelogInfo.cveidInfo.Confidence.Score);

    let getPkg = function() {
        let result;
        $.each(changelogInfo.cveidInfo.AffectedPackages, function(i, i_val) {
            if (i_val.Name = package) {
                result = i_val.NotFixedYet;
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

    if (isCheckNone(changelogInfo.pkgContents)) {
        $("#changelog-packagename").append(package);
        $("#changelog-contents").append("NO DATA");

    } else {
        $("#changelog-packagename").append(pkgContents.Name + "-" + pkgContents.Version + "." + pkgContents.Release + " => " + pkgContents.NewVersion + "." + pkgContents.NewRelease);
        if (changelogInfo.pkgContents.Changelog.Contents === "") {
            $("#changelog-contents").append("NO DATA");
        } else {
            $.each(shapeChangelog(changelogInfo.pkgContents.Changelog.Contents, cveid), function(y, y_val) {
                if (y_val === "") {
                    $("#changelog-contents").append("<br>");
                } else {
                    $("#changelog-contents").append("<div>" + y_val + "</div>");
                }
            });
        }
    }
}

const getChangeLogInfo = function(scantime, server, container, cveid, package) {
    let cveidInfo;
    let changelogContents = "";
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        if ((x_val.scanTime === scantime) && (x_val.data.ServerName === server) && (x_val.data.Container.Name === container)) {
            $.each(x_val.data.ScannedCves, function(y, y_val) {
                if (y_val.CveID === cveid) {
                    cveidInfo = y_val;
                }
            });
            pkgContents = x_val.data.Packages[package];
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
    let v = $('#' + id);
    v.appendTo(v.parent());
}


const toUpperFirstLetter = function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
}