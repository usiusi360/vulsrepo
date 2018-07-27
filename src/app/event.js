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