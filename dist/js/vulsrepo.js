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

            if (resultMap.data.JSONVersion === undefined) {
                showAlert("Old JSON format", value.url);
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

    if (db.get("vulsrepo_chkAheadUrl") === "true") {
        $('input[name="chkAheadUrl"]').bootstrapSwitch('state', true, true);
    }
    if (db.get("vulsrepo_chkPivotSummary") === "false") {
        $('input[name="chkPivotSummary"]').bootstrapSwitch('state', false, false);
    }
    if (db.get("vulsrepo_chkPivotCvss") === "false") {
        $('input[name="chkPivotCvss"]').bootstrapSwitch('state', false, false);
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

    //// priority
    if (db.get("vulsrepo_pivotPriority") === null) {
        db.set("vulsrepo_pivotPriority", "nvd,jvn,redhat");
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
        if (x_val.data.ScannedCves === []) {

            var result = {
                "ScanTime": x_val.scanTime,
                "ServerName": x_val.data.ServerName,
                "Family": x_val.data.Family,
                "Release": x_val.data.Release,
                "CveID": "healthy",
                "Packages": "healthy",
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
                var targetNames;
                if (isCheckNull(y_val.CpeNames) === false) {
                    targetNames = y_val.CpeNames;
                } else {
                    targetNames = y_val.PackageNames;
                }

                $.each(targetNames, function(p, p_val) {
                    if (p_val.indexOf('cpe:/') === -1 && x_val.data.Packages[p_val] === undefined) {
                        return
                    }

                    var result = {
                        "ScanTime": x_val.scanTime,
                        "ServerName": x_val.data.ServerName,
                        "Family": x_val.data.Family,
                        "Release": x_val.data.Release,
                        "CveID": "CHK-cveid-" + y_val.CveID,
                        "Packages": p_val
                    };

                    if (y_val.CveContents.nvd !== undefined) {
                        result["CweID"] = y_val.CveContents.nvd.CweID;
                    } else {
                        result["CweID"] = "Unknown";
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

                    let getCvss = function(target) {
                        if (y_val.CveContents[target] !== undefined) {
                            if (y_val.CveContents[target].Cvss2Score !== 0) {
                                result["CVSS Score"] = y_val.CveContents[target].Cvss2Score;
                                result["CVSS Severity"] = getSeverity(y_val.CveContents[target].Cvss2Score)[0];
                                result["CVSS Score Type"] = target;
                            } else {
                                result["CVSS Score"] = y_val.CveContents[target].Cvss3Score;
                                result["CVSS Severity"] = getSeverity(y_val.CveContents[target].Cvss3Score)[0];
                                result["CVSS Score Type"] = "redhatV3";
                            }

                            if (summaryFlag !== "false") {
                                result["Summary"] = y_val.CveContents[target].Summary;
                            }
                            if (cvssFlag !== "false") {
                                if (y_val.CveContents[target].Cvss2Vector !== "") { //for CVE-2016-5483
                                    var arrayVector = getSplitArray(y_val.CveContents[target].Cvss2Vector);
                                    result["CVSS (AV)"] = getVector.cvss(arrayVector[0])[0];
                                    result["CVSS (AC)"] = getVector.cvss(arrayVector[1])[0];
                                    result["CVSS (Au)"] = getVector.cvss(arrayVector[2])[0];
                                    result["CVSS (C)"] = getVector.cvss(arrayVector[3])[0];
                                    result["CVSS (I)"] = getVector.cvss(arrayVector[4])[0];
                                    result["CVSS (A)"] = getVector.cvss(arrayVector[5])[0];
                                } else {
                                    result["CVSS (AV)"] = "None";
                                    result["CVSS (AC)"] = "None";
                                    result["CVSS (Au)"] = "None";
                                    result["CVSS (C)"] = "None";
                                    result["CVSS (I)"] = "None";
                                    result["CVSS (A)"] = "None";
                                }
                            }
                        }
                    };

                    var flag = false;
                    $.each(prioltyFlag, function(i, i_val) {
                        if (y_val.CveContents[i_val] !== undefined) {
                            if (flag !== true) {
                                getCvss(i_val);
                                flag = true;
                            }
                        }
                    });

                    DetectionMethod = y_val.Confidence.DetectionMethod;
                    result["DetectionMethod"] = DetectionMethod;
                    if (DetectionMethod === "ChangelogExactMatch") {
                        result["Changelog"] = "CHK-changelog-" + y_val.CveID + "," + x_val.scanTime + "," + x_val.data.ServerName + "," + x_val.data.Container.Name + "," + p_val;
                    } else {
                        result["Changelog"] = "None";
                    }

                    array.push(result);
                });
            });
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
        $.each(x_val.data.ScannedCves, function(y, y_val) {
            if (cveID === y_val.CveID) {
                targetObj = y_val;
            }
        });
    });

    return targetObj;
};


var initDetail = function() {
    $("#modal-label").text("");
    $("#count-References").text("0");
    $("#CweID,#Link,#References").empty();

    $("#published_nvd,#lastModified_nvd").text("------");
    $("#scoreText_nvd").text("").css('background-color', 'gray');
    $("#Summary_nvd").empty();
    $("#table_title_nvd").empty();


    $("#published_jvn,#lastModified_jvn").text("------");
    $("#scoreText_jvn").text("").css('background-color', 'gray');
    $("#Summary_jvn").empty();
    $("#table_title_jvn").empty();

    $("#published_redhat,#lastModified_redhat").text("------");
    $("#scoreText_redhat").text("").css('background-color', 'gray');
    $("#Summary_redhat").empty();
    $("#table_title_redhat").empty();

    $("#scoreText_redhatV3").text("").css('background-color', 'gray');
    $("#table_title_redhatV3").empty();

    // $("#cvss_av_jvn,#cvss_ac_jvn,#cvss_au_jvn,#cvss_c_jvn,#cvss_i_jvn,#cvss_a_jvn").removeClass().text("");
    // $("#cvss_av_nvd,#cvss_ac_nvd,#cvss_au_nvd,#cvss_c_nvd,#cvss_i_nvd,#cvss_a_nvd").removeClass().text("");

};


var displayDetail = function(cveID) {
    initDetail();
    var data = createDetailData(cveID);

    // ---CVSS Detail
    $("#modal-label").text(data.CveID);

    let dispCvssV2 = function(target) {
        if (data.CveContents[target] !== undefined) {
            if (data.CveContents[target].Cvss2Score !== 0) {
                $("#published_" + target).text(data.CveContents[target].Published.split("T")[0]);
                $("#lastModified_" + target).text(data.CveContents[target].LastModified.split("T")[0]);
                $("#scoreText_" + target).text(data.CveContents[target].Cvss2Score + " (" + getSeverity(data.CveContents[target].Cvss2Score)[0] + ")").css('background-color', getSeverity(data.CveContents[target].Cvss2Score)[1]);
                $("#Summary_" + target).append("<div>" + data.CveContents[target].Summary + "<div>");

                var arrayVector = getSplitArray(data.CveContents[target].Cvss2Vector);

                var result = [];
                result.push(getVector.cvss(arrayVector[0])[1]);
                result.push(getVector.cvss(arrayVector[1])[1]);
                result.push(getVector.cvss(arrayVector[2])[1]);
                result.push(getVector.cvss(arrayVector[3])[1]);
                result.push(getVector.cvss(arrayVector[4])[1]);
                result.push(getVector.cvss(arrayVector[5])[1]);
            } else {
                $("#scoreText_" + target).text("NO DATA");
                $("#Summary_" + target).append("NO DATA");
            }
        } else {
            $("#scoreText_" + target).text("NO DATA");
            $("#Summary_" + target).append("NO DATA");
        }

        if (result === undefined) {
            result = [0, 0, 0, 0, 0, 0];
        }
        return result;
    }

    let dispCvssV3 = function(target) {
        if (data.CveContents[target] !== undefined) {
            if (data.CveContents[target].Cvss3Score !== 0) {
                $("#published_redhat").text(data.CveContents[target].Published.split("T")[0]);
                $("#lastModified_redhat").text(data.CveContents[target].LastModified.split("T")[0]);
                $("#scoreText_redhatV3").text(data.CveContents[target].Cvss3Score + " (" + getSeverityV3(data.CveContents[target].Cvss3Score)[0] + ")").css('background-color', getSeverityV3(data.CveContents[target].Cvss3Score)[1]);
                $("#Summary_redhat").empty();
                $("#Summary_redhat").append("<div>" + data.CveContents[target].Summary + "<div>");
            } else {
                $("#scoreText_redhatV3").text("NO DATA");
            }
        } else {
            $("#scoreText_redhatV3").text("NO DATA");
        }
    }

    var radarData_nvd = dispCvssV2("nvd");
    var radarData_jvn = dispCvssV2("jvn");
    var radarData_redhat = dispCvssV2("redhat");
    dispCvssV3("redhat");

    // ---CweID---
    if (data.CveContents.nvd !== undefined) {
        if (data.CveContents.nvd.CweID !== "") {
            $("#CweID").append("<span>NVD=[" + data.CveContents.nvd.CweID + "] (</span>");
            $("#CweID").append("<a href=\"" + vulsrepo.link.cwe_nvd.url + data.CveContents.nvd.CweID.split("-")[1] + "\" target='_blank'>MITRE</a>");
            $("#CweID").append("<span>&nbsp;/&nbsp;</span>");
            $("#CweID").append("<a href=\"" + vulsrepo.link.cwe_jvn.url + data.CveContents.nvd.CweID + ".html\" target='_blank'>JVN)</a>");
        }
    }
    $("#CweID").append("<span>&emsp;</span>");
    if (data.CveContents.redhat !== undefined) {
        if (data.CveContents.redhat.CweID !== "") {
            $("#CweID").append("<span>Redhat=[" + data.CveContents.redhat.CweID + "] (</span>");
            $("#CweID").append("<a href=\"" + vulsrepo.link.cwe_nvd.url + data.CveContents.redhat.CweID.split("-")[1] + "\" target='_blank'>MITRE</a>");
            $("#CweID").append("<span>&nbsp;/&nbsp;</span>");
            $("#CweID").append("<a href=\"" + vulsrepo.link.cwe_jvn.url + data.CveContents.redhat.CweID + ".html\" target='_blank'>JVN)</a>");
        }
    }

    // ---Link---
    addLink("#Link", vulsrepo.link.mitre.url + "?name=" + data.CveID, vulsrepo.link.mitre.disp, vulsrepo.link.mitre.find, "mitre");
    $("#Link").append("<span> / </span>");
    addLink("#Link", vulsrepo.link.cveDetail.url + data.CveID, vulsrepo.link.cveDetail.disp, vulsrepo.link.cveDetail.find, "cveDetail");
    $("#Link").append("<span> / </span>");
    addLink("#Link", vulsrepo.link.cvssV2Calculator.url + data.CveID, vulsrepo.link.cvssV2Calculator.disp, vulsrepo.link.cvssV2Calculator.find, "cvssV2Calculator");
    $("#Link").append("<span> / </span>");
    addLink("#Link", vulsrepo.link.cvssV3Calculator.url + data.CveID, vulsrepo.link.cvssV3Calculator.disp, vulsrepo.link.cvssV3Calculator.find, "cvssV3Calculator");
    $("#Link").append("<span> / </span>");
    addLink("#Link", vulsrepo.link.debian.url + data.CveID, vulsrepo.link.debian.disp, vulsrepo.link.debian.find, "debian");
    $("#Link").append("<span> / </span>");
    addLink("#Link", vulsrepo.link.ubuntu.url + data.CveID, vulsrepo.link.ubuntu.disp, vulsrepo.link.ubuntu.find, "ubuntu");
    $("#Link").append("<span> / </span>");
    addLink("#Link", vulsrepo.link.oracle.url + data.CveID + ".html", vulsrepo.link.oracle.disp, vulsrepo.link.oracle.find, "oracle");
    $("#Link").append("<span> / </span>");
    $.each(getDistroAdvisoriesArray(data.DistroAdvisories), function(i, i_val) {
        addLink("#Link", i_val.url, i_val.disp, i_val.find, i_val.imgID);
    });


    addLink("#table_title_nvd", vulsrepo.link.nvd.url + data.CveID, vulsrepo.link.nvd.disp, vulsrepo.link.nvd.find, "nvd");
    if (data.CveContents.jvn !== undefined) {
        if (data.CveContents.jvn.JvnLink === "") {
            $("#table_title_jvn").append("<a href=\"" + vulsrepo.link.jvn.url + data.CveID + "\" target='_blank'>JVN</a>");
        } else {
            $("#table_title_jvn").append("<a href=\"" + data.CveContents.jvn.SourceLink + "\" target='_blank'>JVN</a>");
        }
    } else {
        $("#table_title_jvn").append("<a href=\"" + vulsrepo.link.jvn.url + data.CveID + "\" target='_blank'>JVN</a>");
    }
    addLink("#table_title_redhat", vulsrepo.link.rhel.url + data.CveID, "Redhat (v2)", vulsrepo.link.rhel.find, "rhel");
    addLink("#table_title_redhatV3", vulsrepo.link.rhel.url + data.CveID, "Redhat (v3)", vulsrepo.link.rhel.find, "rhel");

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

    var ctx = document.getElementById("myRadarChart").getContext("2d");

    if (typeof myChart != "undefined") {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
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
                    label: "RedhatV2",
                    backgroundColor: "rgba(51,204,204,0.2)",
                    borderColor: "rgba(51,204,204,1)",
                    pointBackgroundColor: "rgba(51,204,204,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(51,204,204,1)",
                    hitRadius: 5,
                    data: radarData_redhat
                }
            ]
        }
    });

    // $("#Summary_redhat").collapse('reInit');

    $('#Summary_redhat').collapser({
        mode: 'words',
        truncate: 50
    });

    // $("#Summary_redhat").collapse('reInit');

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
                    targets = y_val.PackageNames;
                }

                $.each(targets, function(z, z_val) {

                    if (x_val.data.Packages[z_val] === undefined) {
                        return
                    }

                    let tmp_Map = {
                        ScanTime: x_val.scanTime,
                        ServerName: x_val.data.ServerName,
                        ContainerName: x_val.data.Container.Name,
                    };

                    tmp_Map["PackageName"] = '<a href="#contents" class="lightbox" data-cveid="' + cveID + '" data-scantime="' + x_val.scanTime + '" data-server="' + x_val.data.ServerName + '" data-container="' + x_val.data.Container.Name + '" data-package="' + z_val + '">' + z_val + '</a>';
                    tmp_Map["PackageVersion"] = x_val.data.Packages[z_val].Version;
                    tmp_Map["PackageRelease"] = x_val.data.Packages[z_val].Release;
                    tmp_Map["PackageNewVersion"] = x_val.data.Packages[z_val].NewVersion;
                    tmp_Map["PackageNewRelease"] = x_val.data.Packages[z_val].NewRelease;
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

    if (isCheckNull(changelogInfo.pkgContents) !== true) {
        $("#changelog-packagename").append(pkgContents.Name + "-" + pkgContents.Version + "." + pkgContents.Release + " => " + pkgContents.NewVersion + "." + pkgContents.NewRelease);
    }

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
            pkgContents = x_val.data.Packages[package];
        }
    });
    return { "cveidInfo": cveidInfo, "pkgContents": pkgContents };
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