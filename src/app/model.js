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