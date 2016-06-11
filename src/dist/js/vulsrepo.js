var vulsrepo = {
    json_file : "current/all.json",
    rawData : null,
    NVD_URL : 'https://web.nvd.nist.gov/view/vuln/detail',
    MITRE_URL : 'https://cve.mitre.org/cgi-bin/cvename.cgi',
    CVE_URL : 'http://www.cvedetails.com/cve/',
    CVSS_URL : 'https://nvd.nist.gov/cvss/v2-calculator',
    RHEL_URL : 'https://access.redhat.com/security/cve/'

};

$(document).ready(function() {
    setEvents();
    getData().done(function(json_data) {
	displayPivot(createPivotData(json_data));
	filterDisp.off("pivot_conf");
    });

});

var db = {
    set : function(key, obj) {
	localStorage.setItem(key, JSON.stringify(obj));
    },
    get : function(key) {
	return JSON.parse(localStorage.getItem(key));
    },
    remove : function(key) {
	localStorage.removeItem(key);
    }
};

var filterDisp = {
    on : function(labelName) {
	$(labelName).removeClass("label-info").addClass("label-warning").text("Filter ON");
    },

    off : function(labelName) {
	$(labelName).removeClass("label-warning").addClass("label-info").text("Filter OFF");
    }
};

var alertFade = function(target) {
    $(target).fadeIn(1000).delay(2000).fadeOut(1000);
};

var getData = function() {
    var defer = new $.Deferred();
    $.getJSON(vulsrepo.json_file).done(function(json_data) {
	console.log(json_data);
	defer.resolve(json_data);
	vulsrepo.rawData = json_data;
    });
    return defer.promise();
};

var getSeverity = function(Score) {

    var severity;
    if (Score >= 7.0) {
	severity = "High";
    } else if ((Score < 7.0) && (Score >= 4.0)) {
	severity = "Medium";
    } else if ((Score < 4.0)) {
	severity = "Low";
    }

    return severity;
};

var setEvents = function() {
    $("#nvd_help").tooltip({});
    // $("a[data-toggle=popover]").popover();

    $("#save_pivot_conf").click(function() {
	db.set("vulsrepo_pivot_conf", db.get("vulsrepo_pivot_conf_tmp"));
	filterDisp.on("#label_pivot_conf");
	alertFade("#alert_pivot_conf");
    });

    $("#clear_pivot_conf").click(function() {
	db.remove("vulsrepo_pivot_conf");
	filterDisp.off("#label_pivot_conf");
	alertFade("#alert_pivot_conf");

	getData().done(function(json_data) {
	    displayPivot(createPivotData(json_data));
	});
    });

};

var getSplitArray = function(full_vector) {
    return full_vector.replace(/\(|\)/g, '').split("/");
};

var getVector = function(vector) {

    var subscore = vector.split(":");

    switch (subscore[0]) {
    case 'AV':
	switch (subscore[1]) {
	case 'L':
	    return "LOCAL";
	    break;
	case 'A':
	    return "ADJACENT_NETWORK";
	    break;
	case 'N':
	    return "NETWORK";
	    break;
	}
    case 'AC':
	switch (subscore[1]) {
	case 'H':
	    return "HIGH";
	    break;
	case 'M':
	    return "MEDIUM";
	    break;
	case 'L':
	    return "LOW";
	    break;
	}
    case 'Au':
	switch (subscore[1]) {
	case 'N':
	    return "NONE";
	    break;
	case 'S':
	    return "SINGLE_INSTANCE";
	    break;
	case 'M':
	    return "MULTIPLE_INSTANCES";
	    break;
	}
    case 'C':
	switch (subscore[1]) {
	case 'N':
	    return "NONE";
	    break;
	case 'P':
	    return "PARTIAL";
	    break;
	case 'C':
	    return "COMPLETE";
	    break;
	}
    case 'I':
	switch (subscore[1]) {
	case 'N':
	    return "NONE";
	    break;
	case 'P':
	    return "PARTIAL";
	    break;
	case 'C':
	    return "COMPLETE";
	    break;
	}
    case 'A':
	switch (subscore[1]) {
	case 'N':
	    return "NONE";
	    break;
	case 'P':
	    return "PARTIAL";
	    break;
	case 'C':
	    return "COMPLETE";
	    break;
	}
    }
};

var createPivotData = function(json_data) {

    var array = [];

    $.each(json_data, function(x, x_val) {
	$.each(x_val.KnownCves, function(y, y_val) {

	    $.each(y_val.Packages, function(p, p_val) {
		var KnownObj = {
		    "ServerName" : x_val.ServerName,
		    "Family" : x_val.Family,
		    "Release" : x_val.Release,
		    "CveID" : '<a class="cveid">' + y_val.CveDetail.CveID + '</a>',
		    "Packages" : p_val.Name,
		};

		if (x_val.Platform.Name !== "") {
		    KnownObj["Platform"] = x_val.Platform.Name;
		} else {
		    KnownObj["Platform"] = "None";
		}
	
		if (x_val.Container.Name !== "") {
		    KnownObj["Container"] = x_val.Container.Name;
		} else {
		    KnownObj["Container"] = "None";
		}

		if (y_val.CveDetail.Jvn.Score !== 0) {
		    KnownObj["CVSS Score"] = y_val.CveDetail.Jvn.Score;
		    KnownObj["CVSS Severity"] = y_val.CveDetail.Jvn.Severity;
		    KnownObj["Summary"] = y_val.CveDetail.Jvn.Title;

		    // ex) CveDetail.Jvn.Vector (AV:A/AC:H/Au:N/C:N/I:P/A:N)
		    var arrayVector = getSplitArray(y_val.CveDetail.Jvn.Vector);
		    KnownObj["CVSS (AV)"] = getVector(arrayVector[0]);
		    KnownObj["CVSS (AC)"] = getVector(arrayVector[1]);
		    KnownObj["CVSS (Au)"] = getVector(arrayVector[2]);
		    KnownObj["CVSS (C)"] = getVector(arrayVector[3]);
		    KnownObj["CVSS (I)"] = getVector(arrayVector[4]);
		    KnownObj["CVSS (A)"] = getVector(arrayVector[5]);
		} else if (y_val.CveDetail.Nvd.Score !== 0) {
		    KnownObj["CVSS Score"] = y_val.CveDetail.Nvd.Score;
		    KnownObj["CVSS Severity"] = getSeverity(y_val.CveDetail.Nvd.Score);
		    KnownObj["Summary"] = y_val.CveDetail.Nvd.Summary;
		    KnownObj["CVSS (AV)"] = y_val.CveDetail.Nvd.AccessVector;
		    KnownObj["CVSS (AC)"] = y_val.CveDetail.Nvd.AccessComplexity;
		    KnownObj["CVSS (Au)"] = y_val.CveDetail.Nvd.Authentication;
		    KnownObj["CVSS (C)"] = y_val.CveDetail.Nvd.ConfidentialityImpact;
		    KnownObj["CVSS (I)"] = y_val.CveDetail.Nvd.IntegrityImpact;
		    KnownObj["CVSS (A)"] = y_val.CveDetail.Nvd.AvailabilityImpact;
		}

		array.push(KnownObj);

	    });

	});

	$.each(x_val.UnknownCves, function(y, y_val) {

	    var UnknownObj = {
		"ServerName" : x_val.ServerName,
		"Family" : x_val.Family,
		"Release" : x_val.Release,
		"CveID" : '<a class="cveid">' + y_val.CveDetail.CveID + '</a>',
		"Packages" : "Unknown",
		"CVSS Score" : "Unknown",
		"CVSS Severity" : "Unknown",
		"Summary" : "Unknown",
		"CVSS (AV)" : "Unknown",
		"CVSS (AC)" : "Unknown",
		"CVSS (Au)" : "Unknown",
		"CVSS (C)" : "Unknown",
		"CVSS (I)" : "Unknown",
		"CVSS (A)" : "Unknown"
	    };

	    if (x_val.Platform.Name !== "") {
		UnknownObj["Platform"] = x_val.Platform.Name;
	    } else {
		UnknownObj["Platform"] = "None";
	    }
	    
	    if (x_val.Container.Name !== "") {
		UnknownObj["Container"] = x_val.Container.Name;
	    } else {
		UnknownObj["Container"] = "None";
	    }

	    array.push(UnknownObj);
	});
    });

    return array;
};

var displayPivot = function(array) {

    var derivers = $.pivotUtilities.derivers;
    // var renderers = $.extend($.pivotUtilities.renderers,
    // $.pivotUtilities.c3_renderers, $.pivotUtilities.d3_renderers);
    var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.c3_renderers);
    var dateFormat = $.pivotUtilities.derivers.dateFormat;
    var sortAs = $.pivotUtilities.sortAs;

    var pivot_attr = {
	renderers : renderers,
	menuLimit : 3000,
	rows : [ "ServerName" ],
	cols : [ "CVSS Severity", "CVSS Score" ],
	vals : [ "" ],
	exclusions : "",
	aggregatorName : "Count",
	rendererName : "Heatmap",
	sorters : function(attr) {
	    if (attr == "CVSS Severity") {
		return sortAs([ "Low", "Medium", "High", "Unknown" ]);
	    }

	},
	onRefresh : function(config) {
	    db.set("vulsrepo_pivot_conf_tmp", config);
	    $('.cveid').on('click', function() {
		displayDetail(this.text);
	    });
	    $("#pivot_base").find(".pvtVal[data-value='null']").css("background-color", "palegreen");
	}

    };

    var pivot_obj = db.get("vulsrepo_pivot_conf");
    if (pivot_obj != null) {
	pivot_attr["rows"] = pivot_obj["rows"];
	pivot_attr["cols"] = pivot_obj["cols"];
	pivot_attr["vals"] = pivot_obj["vals"];
	pivot_attr["exclusions"] = pivot_obj["exclusions"];
	pivot_attr["aggregatorName"] = pivot_obj["aggregatorName"];
	pivot_attr["rendererName"] = pivot_obj["rendererName"];
	filterDisp.on("#label_pivot_conf");
    } else {
	filterDisp.off("#label_pivot_conf");
    }

    $("#pivot_base").pivotUI(array, pivot_attr, {
	overwrite : "true"
    });

};

var createDetailData = function(th) {

    var targetObj;

    $.each(vulsrepo.rawData, function(x, x_val) {
	$.each(x_val.KnownCves, function(y, y_val) {
	    if (th === y_val.CveDetail.CveID) {
		targetObj = y_val.CveDetail;
	    }
	});

	$.each(x_val.UnknownCves, function(y, y_val) {
	    if (th === y_val.CveDetail.CveID) {
		targetObj = y_val.CveDetail;
	    }
	});
    });

    return targetObj;

};

var displayDetail = function(th) {

    var data = createDetailData(th);

    $("#modal-label").text("");
    $("#Title").empty();
    $("#Score").empty();
    $("#Summary").empty();
    $("#Link").empty();
    $("#References").empty();

    $("#modal-label").text(data.CveID);
    if (data.Jvn.Title !== "") {
	$("#Title").append("<div>" + data.Jvn.Title + "<div>");
    } else if (data.Nvd.Summary !== "") {
	// Do not put anything because it is the same as the summary in the case
	// of NVD
    } else {
	$("#Title").append("<div>Unknown<div>");
    }

    if (data.Jvn.Score !== 0) {
	// $("#Score").append("<div>" + data.Jvn.Score + " (" +
	// data.Jvn.Severity + ") " + data.Jvn.Vector + "</div>");
	var arrayVector = getSplitArray(data.Jvn.Vector);

	$("#Score").append(
		"<div>" + data.Jvn.Score + " (" + data.Jvn.Severity + ") " + " (AV:" + getVector(arrayVector[0]) + " /AC:"
			+ getVector(arrayVector[1]) + " /Au:" + getVector(arrayVector[2]) + " /C:" + getVector(arrayVector[3]) + " /I:"
			+ getVector(arrayVector[4]) + " /A:" + getVector(arrayVector[5]) + ")</div>");

	$("#Summary").append("<div>" + data.Jvn.Summary + "<div>");
	$("#Summary").append("<br>");

    } else if (data.Nvd.Score !== 0) {
	$("#Score").append(
		"<div>" + data.Nvd.Score + " (" + getSeverity(data.Nvd.Score) + ") " + " (AV:" + data.Nvd.AccessVector + " /AC:"
			+ data.Nvd.AccessComplexity + " /Au:" + data.Nvd.Authentication + " /C:" + data.Nvd.ConfidentialityImpact + " /I:"
			+ data.Nvd.IntegrityImpact + " /A:" + data.Nvd.AvailabilityImpact + ")</div>");
    } else {
	$("#Score").append("<div>Unknown</div>");
    }

    if (data.Nvd.Summary !== "") {
	$("#Summary").append("<div>" + data.Nvd.Summary + "<div>");
    } else {
	$("#Summary").append("<div>Unknown<div>");
    }

    $("#Link").append("<a href=\"" + vulsrepo.NVD_URL + "?vulnId=" + data.CveID + "\" target='_blank'>NVD</a>");
    $("#Link").append("<span> / </span>");
    $("#Link").append("<a href=\"" + vulsrepo.MITRE_URL + "?name=" + data.CveID + "\" target='_blank'>MITRE</a>");
    $("#Link").append("<span> / </span>");
    $("#Link").append("<a href=\"" + vulsrepo.CVE_URL + data.CveID + "\" target='_blank'>CveDetais</a>");
    $("#Link").append("<span> / </span>");
    $("#Link").append(
	    "<a href=\"" + vulsrepo.CVSS_URL + "?name=" + data.CveID + "&vector=" + data.Jvn.Vector + "\" target='_blank'>CVSSv2 Caluclator</a>");
    $("#Link").append("<span> / </span>");
    $("#Link").append("<a href=\"" + vulsrepo.RHEL_URL + data.CveID + "\" target='_blank'>RHEL-CVE</a>");

    if (data.Jvn.JvnLink !== "") {
	$("#Link").append("<span> / </span>");
	$("#Link").append("<a href=\"" + data.Jvn.JvnLink + "\" target='_blank'>JVN</a>");
    }

    if (data.Jvn.References !== null) {
	$.each(data.Jvn.References, function(x, x_val) {
	    $("#References").append("<div>[" + x_val.Source + "]<a href=\"" + x_val.Link + "\" target='_blank'> (" + x_val.Link + ")</a></div>");
	});
    }
    if (data.Nvd.References !== null) {
	$.each(data.Nvd.References, function(x, x_val) {
	    $("#References").append("<div>[" + x_val.Source + "]<a href=\"" + x_val.Link + "\" target='_blank'> (" + x_val.Link + ")</a></div>");
	});
    }

    $("#modal-top").modal('show');

};
