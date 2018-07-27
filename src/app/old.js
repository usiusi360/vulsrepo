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