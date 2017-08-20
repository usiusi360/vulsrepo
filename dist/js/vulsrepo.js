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

            if (resultMap.data.JSONVersion === undefined) {
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

    if (db.get("vulsrepo_pivotPriority") === null) {
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
        target = "getfilelist"
    }

    var tree = $("#folderTree").dynatree({
        initAjax: {
            url: target
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
        if (Object.keys(x_val.data.ScannedCves).length === 0) {

            let result = {
                "ScanTime": x_val.scanTime,
                "ServerName": x_val.data.ServerName,
                "Family": x_val.data.Family,
                "Release": x_val.data.Release,
                "CveID": "healthy",
                "Packages": "healthy",
                "NotFixedYet": "healthy",
                "PackageVer": "healthy",
                "NewPackageVer": "healthy",
                "CweID": "healthy",
                "Summary": "healthy",
                "CVSS Score": "healthy",
                "CVSS Severity": "healthy",
                "CVSS (AV)": "healthy",
                "CVSS (AC)": "healthy",
                "CVSS (Au)": "healthy",
                "CVSS (C)": "healthy",
                "CVSS (I)": "healthy",
                "CVSS (A)": "healthy",
                "Changelog": "healthy",
                "DetectionMethod": "healthy",
            };

            if (x_val.data.Platform.Name !== "") {
                result["Platform"] = x_val.data.Platform.Name;
            } else {
                result["Platform"] = "None";
            }

            if (x_val.data.Container.Name !== "") {
                result["Container"] = x_val.data.Container.Name;
            } else {
                result["Container"] = "None";
            }
            array.push(result);
        } else {
            $.each(x_val.data.ScannedCves, function(y, y_val) {
                let targetNames;
                if (isCheckNull(y_val.CpeNames) === false) {
                    targetNames = y_val.CpeNames;
                } else {
                    targetNames = y_val.AffectedPackages;
                }

                cveid_count = cveid_count + 1
                $.each(targetNames, function(p, p_val) {
                    if (p_val.Name === undefined) {
                        pkgName = p_val;
                        NotFixedYet = "Unknown";
                    } else {
                        pkgName = p_val.Name;
                        NotFixedYet = p_val.NotFixedYet;
                    }

                    let pkgInfo = x_val.data.Packages[pkgName];
                    if (pkgName.indexOf('cpe:/') === -1 && pkgInfo === undefined) {
                        return;
                    }

                    let result = {
                        "ScanTime": x_val.scanTime,
                        "ServerName": x_val.data.ServerName,
                        "Family": x_val.data.Family,
                        "Release": x_val.data.Release,
                        "CveID": "CHK-cveid-" + y_val.CveID,
                        "Packages": pkgName,
                        "NotFixedYet": NotFixedYet,
                    };

                    if (y_val.CveContents.nvd !== undefined) {
                        result["CweID"] = y_val.CveContents.nvd.CweID;
                    } else {
                        result["CweID"] = "None";
                    }

                    if (x_val.data.Platform.Name !== "") {
                        result["Platform"] = x_val.data.Platform.Name;
                    } else {
                        result["Platform"] = "None";
                    }

                    if (x_val.data.Container.Name !== "") {
                        result["Container"] = x_val.data.Container.Name;
                    } else {
                        result["Container"] = "None";
                    }

                    DetectionMethod = y_val.Confidence.DetectionMethod;
                    result["DetectionMethod"] = DetectionMethod;
                    if (DetectionMethod === "ChangelogExactMatch") {
                        result["Changelog"] = "CHK-changelog-" + y_val.CveID + "," + x_val.scanTime + "," + x_val.data.ServerName + "," + x_val.data.Container.Name + "," + pkgName;
                    } else {
                        result["Changelog"] = "None";
                    }

                    if (pkgInfo !== undefined) {
                        if (pkgInfo.Version !== "") {
                            result["PackageVer"] = pkgInfo.Version + "-" + pkgInfo.Release;
                        } else {
                            result["PackageVer"] = "None";
                        }

                        if (pkgInfo.NewVersion !== "") {
                            result["NewPackageVer"] = pkgInfo.NewVersion + "-" + pkgInfo.NewRelease;
                        } else {
                            result["NewPackageVer"] = "None";
                        }
                    } else {
                        // ===for cpe
                        result["PackageVer"] = "Unknown";
                        result["NewPackageVer"] = "Unknown";
                    }


                    let getCvss = function(target) {
                        if (y_val.CveContents[target] === undefined) {
                            return false;
                        }

                        if (y_val.CveContents[target].Cvss2Score === 0 & y_val.CveContents[target].Cvss3Score === 0) {
                            return false;
                        }

                        if (y_val.CveContents[target].Cvss2Score !== 0) {
                            result["CVSS Score"] = y_val.CveContents[target].Cvss2Score;
                            result["CVSS Severity"] = getSeverity(y_val.CveContents[target].Cvss2Score);
                            result["CVSS Score Type"] = target;
                        } else if (y_val.CveContents[target].Cvss3Score !== 0) {
                            result["CVSS Score"] = y_val.CveContents[target].Cvss3Score;
                            result["CVSS Severity"] = getSeverity(y_val.CveContents[target].Cvss3Score);
                            result["CVSS Score Type"] = target + "V3";
                        }

                        if (summaryFlag !== "false") {
                            result["Summary"] = y_val.CveContents[target].Summary;
                        }

                        if (cvssFlag !== "false") {
                            if (y_val.CveContents[target].Cvss2Vector !== "") { //ex) CVE-2016-5483
                                var arrayVector = getSplitArray(y_val.CveContents[target].Cvss2Vector);
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
                        result["CVSS (AV)"] = "Unknown";
                        result["CVSS (AC)"] = "Unknown";
                        result["CVSS (Au)"] = "Unknown";
                        result["CVSS (C)"] = "Unknown";
                        result["CVSS (I)"] = "Unknown";
                        result["CVSS (A)"] = "Unknown";
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
            $("#pivot_base").find("th:contains('true')").css("color", "red");
            $("#pivot_base").find("th:contains('false')").css("color", "blue");
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
    var targetObj;
    $.each(vulsrepo.detailRawData, function(x, x_val) {
        tmpCve = x_val.data.ScannedCves[cveID];
        if (tmpCve !== undefined) {
            targetObj = tmpCve;
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
    })
};


const displayDetail = function(cveID) {
    initDetail();
    let data = createDetailData(cveID);

    // ---CVSS Detail
    $("#modal-label").text(data.CveID);

    let dispCvss = function(target) {
        if (data.CveContents[target] !== undefined) {
            scoreV2 = data.CveContents[target].Cvss2Score;
            scoreV3 = data.CveContents[target].Cvss3Score;
            severity = toUpperFirstLetter(data.CveContents[target].Severity);

            // -- for nvd
            if (severity === "") {
                if (scoreV2 !== 0) {
                    severity = getSeverity(scoreV2);
                } else if (scoreV3 !== 0) {
                    severity = getSeverity(scoreV3);
                } else {
                    severity = "None";
                }
            }

            if (scoreV2 !== 0) {
                $("#scoreText_" + target).text(scoreV2 + " (" + severity + ")").addClass("cvss-" + severity);
            } else {
                $("#scoreText_" + target).text("None").addClass("cvss-None");
            }

            if (scoreV3 !== 0) {
                $("#scoreText_" + target + "V3").text(scoreV3 + " (" + severity + ")").addClass("cvss-" + severity);
            } else {
                $("#scoreText_" + target + "V3").text("None").addClass("cvss-None");
            }

            if (target === "ubuntu" || target === "debian") {
                $("#scoreText_" + target).removeClass();
                $("#scoreText_" + target).text(severity).addClass("cvss-" + severity);
            }

            if (data.CveContents[target].Summary !== "") {
                $("#summary_" + target).append("<div>" + data.CveContents[target].Summary + "<div>");
            }

            if (data.CveContents[target].LastModified !== "0001-01-01T00:00:00Z") {
                $("#lastModified_" + target).text(data.CveContents[target].LastModified.split("T")[0]);
            } else {
                $("#lastModified_" + target).text("------");
                $("#lastModified_" + target + "V3").text("------");
            }

            var resultV2 = [];
            if (data.CveContents[target].Cvss2Vector !== "") {
                var arrayVectorV2 = getSplitArray(data.CveContents[target].Cvss2Vector);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[0])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[1])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[2])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[3])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[4])[1]);
                resultV2.push(getVectorV2.cvss(arrayVectorV2[5])[1]);
            }

            var resultV3 = [];
            if (data.CveContents[target].Cvss3Vector !== "") {
                var arrayVectorV3 = getSplitArray(data.CveContents[target].Cvss3Vector);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[0])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[1])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[2])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[3])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[4])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[5])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[6])[1]);
                resultV3.push(getVectorV3.cvss(arrayVectorV3[7])[1]);
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
    let radarData_jvn
    let radarData_redhatV2
    let radarData_redhatV3

    $.each(vulsrepo.detailTaget, function(i, i_val) {
        let r = dispCvss(i_val);
        switch (i_val) {
            case "nvd":
                radarData_nvd = r[0];
                break;
            case "jvn":
                radarData_jvn = r[0];
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


    // ---CweID---
    if (data.CveContents.nvd !== undefined) {
        if (data.CveContents.nvd.CweID !== "") {
            $("#CweID").append("<span>NVD:[" + data.CveContents.nvd.CweID + "] (</span>");
            $("#CweID").append("<a href=\"" + detailLink.cwe_nvd.url + data.CveContents.nvd.CweID.split("-")[1] + "\" target='_blank'>MITRE</a>");
            $("#CweID").append("<span>&nbsp;/&nbsp;</span>");
            $("#CweID").append("<a href=\"" + detailLink.cwe_jvn.url + data.CveContents.nvd.CweID + ".html\" target='_blank'>JVN)</a>");
            $("#CweID").append("<span>&emsp;</span>");
        }
    }

    if (data.CveContents.redhat !== undefined) {
        if (data.CveContents.redhat.CweID !== "") {
            $("#CweID").append("<span>RedHat:[" + data.CveContents.redhat.CweID + "] (</span>");
            $("#CweID").append("<a href=\"" + detailLink.cwe_nvd.url + data.CveContents.redhat.CweID.split("-")[1] + "\" target='_blank'>MITRE</a>");
            $("#CweID").append("<span>&nbsp;/&nbsp;</span>");
            $("#CweID").append("<a href=\"" + detailLink.cwe_jvn.url + data.CveContents.redhat.CweID + ".html\" target='_blank'>JVN)</a>");
        }
    }

    // ---Link---
    var addLink = function(target, url, disp) {
        $(target).append("<a href=\"" + url + "\" target='_blank'>" + disp + " </a>");
    };

    addLink("#Link", detailLink.mitre.url + "?name=" + data.CveID, detailLink.mitre.disp);
    $("#Link").append("<span> / </span>");
    addLink("#Link", detailLink.cveDetail.url + data.CveID, detailLink.cveDetail.disp);
    $("#Link").append("<span> / </span>");
    addLink("#Link", detailLink.cvssV2Calculator.url + data.CveID, detailLink.cvssV2Calculator.disp);
    $("#Link").append("<span> / </span>");
    addLink("#Link", detailLink.cvssV3Calculator.url + data.CveID, detailLink.cvssV3Calculator.disp);
    $("#Link").append("<span> / </span>");
    addLink("#Link", detailLink.oracle.url + data.CveID + ".html", detailLink.oracle.disp);
    $("#Link").append("<span> / </span>");
    $.each(getDistroAdvisoriesArray(data.DistroAdvisories), function(i, i_val) {
        addLink("#Link", i_val.url, i_val.disp);
    });


    addLink("#typeName_nvd", detailLink.nvd.url + data.CveID, detailLink.nvd.disp);
    if (data.CveContents.jvn !== undefined) {
        if (data.CveContents.jvn.JvnLink === "") {
            $("#typeName_jvn").append("<a href=\"" + detailLink.jvn.url + data.CveID + "\" target='_blank'>JVN</a>");
        } else {
            $("#typeName_jvn").append("<a href=\"" + data.CveContents.jvn.SourceLink + "\" target='_blank'>JVN</a>");
        }
    } else {
        $("#typeName_jvn").append("<a href=\"" + detailLink.jvn.url + data.CveID + "\" target='_blank'>JVN</a>");
    }
    addLink("#typeName_redhat", detailLink.rhel.url + data.CveID, "RedHat (v2)");
    addLink("#typeName_redhatV3", detailLink.rhel.url + data.CveID, "RedHat (v3)");
    addLink("#typeName_ubuntu", detailLink.ubuntu.url + data.CveID, detailLink.ubuntu.disp);
    addLink("#typeName_debian", detailLink.debian.url + data.CveID, detailLink.debian.disp);

    // ---References---
    let countRef = 0;

    var addRef = function(target) {
        if (data.CveContents[target] !== undefined) {
            if (isCheckNull(data.CveContents[target].References) === false) {
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

    $("#table-package").find("td:contains('true')").css("color", "red");
    $("#table-package").find("td:contains('false')").css("color", "blue");

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
        $.each(x_val.data.ScannedCves, function(y, y_val) {
            if (cveID === y_val.CveID) {
                if (isCheckNull(y_val.CpeNames) === false) {
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
        $("#changelog-notfixedyet").append("true");
        $("#changelog-notfixedyet").css("color", "red");
    } else if (notFixedYet === false) {
        $("#changelog-notfixedyet").append("false");
        $("#changelog-notfixedyet").css("color", "blue");
    }

    if (isCheckNull(changelogInfo.pkgContents) !== true) {
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
    } else {
        $("#changelog-packagename").append(package);
        $("#changelog-contents").append("NO DATA");
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
    var v = $('#' + id);
    v.appendTo(v.parent());
}

const toUpperFirstLetter = function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
}