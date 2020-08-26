// Global variables
const PASSWORD_MINIMUM_LENGTH = 6;
const RSA_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\n" +
                       "MIIBITANBgkqhkiG9w0BAQEFAAOCAQ4AMIIBCQKCAQB4CJQCshNzqnvLZFP3b3nn\n" +
                       "Fgb0q3Q58lEjEVfLOS+VDet4ycn7/MrlZk226PvNMHfDXHyiAtHS/MeCju33aJcu\n" +
                       "1cEUuficNZ+B0iXxvgbDoK+wBqzs5EM/1gQjVlxivUa59b5YpLxDkuwzFcV3Lgaf\n" +
                       "MCqKuX8tY4nD/TJ+u5y9UDwzMHbWgeYXcwXyC3+Pd574QyXIP1r58CaxpuAuk+/I\n" +
                       "YgE74533oHgPyDJjiokFyR8tQb13Bt+gtugPG3u3wzCh5jVhE0R+sexmGF4U9mlJ\n" +
                       "gqTK0RMiSOXOus1tShiehv9pIlFpJXVRqDlOUoesBhxSdPxS4SW0tioXAeMcQXDX\n" +
                       "AgMBAAE=\n" +
                       "-----END PUBLIC KEY-----\n";

const RSA = new JSEncrypt();
RSA.setPublicKey(RSA_PUBLIC_KEY);
const API_ROOT = "/ExpTransfer/TransferServlet";
const TIMEOUT_MS = 10000;

// Tools
function ajaxErrorHandler(jqXHR, textStatus, errorThrown)
{
    "use strict";
    console.log("服务器返回页面：");
    console.log(jqXHR.responseText);

    let javaException = null;

    try
    {
        let json = JSON.parse(jqXHR.responseText);
        javaException = json["exception"];
    }
    catch (ignored) {}

    showNotificationBarWithFading("服务器开小差了，请过会再提交一次吧……Orz", "error");
    showNotificationBar("技术人员参考信息：" +
                        "(" +
                        "(" +
                        jqXHR.status + ", " +
                        jqXHR.statusText +
                        ")" + ", " +
                        textStatus + ", " +
                        javaException + ", " +
                        errorThrown
                        + ")", "error"
    );
}

function disableLoginButton()
{
    "use strict";
    $("input#btn-login").attr("disabled", "disabled");
}

function enableLoginButton()
{
    "use strict";
    try
    {
        $("input#btn-login").removeAttr("disabled");
    }
    catch (e) {}
}

// Basic form: Forum username and password
function checkOnUsernamePasswordChange()
{
    "use strict";
    const username = $("input#ibox-uname").val().trim();
    const password = $("input#ibox-pwd").val().trim();

    return username.length !== 0 && password.length >= PASSWORD_MINIMUM_LENGTH;
}

function checkUsernamePassword()
{
    "use strict";
    const username = $("input#ibox-uname").val().trim();
    const password = $("input#ibox-pwd").val().trim();

    const regex_password = /^(?=.*[a-z])(?=.*[A-Z])[\x21-\x7e]{6,}$/;

    // Detect if blanked
    if (username === "" || password === "" ||
        username === null || password === null ||
        username === undefined || password === undefined)
    {
        showLoginPrompt();
        showNotificationBarWithFading("请输入用户名和密码！", "error");
        return false;
    }

    // Check password format
    if (!checkOnUsernamePasswordChange() || regex_password.exec(password) === null)
    {
        showNotificationBarWithFading("密码格式错误！", "error");
        showNotificationBarWithFading("密码长度必须为至少为6位，至少包含大写字母和小写字母，不能包含空格");
        return false;
    }
    else
    {
        return true;
    }
}

function verifyUsernameAndPassword()
{
    if (checkUsernamePassword())
    {
        disableLoginButton();
        showNotificationBarWithFading("正在验证……");

        $.ajax(
            {
                async      : true,
                contentType: "application/json; charset=utf-8",
                method     : "POST",
                url        : API_ROOT,
                timeout    : TIMEOUT_MS,
                dataType   : "json",
                data       : JSON.stringify(
                    {
                        "authType": "0",
                        "username": $("input#ibox-uname").val().trim(),
                        "password": CryptoJS.MD5($("input#ibox-pwd").val().trim()).toString()
                    }),
                success(data, textStatus)
                {
                    const json = data;

                    switch (json["code"])
                    {
                        case "0":
                            showNotificationBarWithFading("验证通过，请继续填写以下信息")
                            disableUsernamePasswordInput();
                            showExtForm();
                            break;
                        default:
                            showNotificationBarWithFading("服务器返回错误信息！", "error");
                            showNotificationBar(json["message"] +
                                                " (" +
                                                textStatus + ", " +
                                                json["code"].toString() +
                                                ")", "error");
                            enableLoginButton();
                            break;
                    }
                },
                error(jqXHR, textStatus, errorThrown)
                {
                    ajaxErrorHandler(jqXHR, textStatus, errorThrown);
                    enableLoginButton();
                }
            });
    }
}

function disableUsernamePasswordInput()
{
    "use strict";
    $("input#ibox-uname").attr("disabled", "disabled");
    $("input#ibox-pwd").attr("disabled", "disabled");
}

function showLoginPrompt()
{
    "use strict";
    const tags = document.getElementsByClassName("login-prompt");
    for (let i = 0; i < tags.length; ++i)
    {
        if (tags[i] !== null)
        {
            tags[i].innerHTML = "*必填";
        }
    }
}

function hideLoginPrompt()
{
    "use strict";
    const tags = document.getElementsByClassName("login-prompt");
    for (let i = 0; i < tags.length; ++i)
    {
        if (tags[i] !== null)
        {
            tags[i].innerHTML = "";
        }
    }
}

// Extra form: Tieba info
function showExtForm()
{
    const button = $("input#btn-login");
    const form = $("div#login-form");

    hideLoginPrompt();

    button.unbind("click");
    button.attr("value", "提交");
    button.attr("disabled", "disabled");

    // Input box action
    $("input#ibox-tieba-id").on("input propertychange paste cut keydown keyup keypress",
                                function()
                                {
                                    if (checkOnTiebaInfoChange())
                                    {
                                        enableLoginButton();
                                    }
                                    else
                                    {
                                        disableLoginButton();
                                        button.attr("disabled", "disabled");
                                    }
                                }
    )
    $("input#ibox-bduss").on("input propertychange paste cut keydown keyup keypress",
                             function()
                             {
                                 if (checkOnTiebaInfoChange())
                                 {
                                     enableLoginButton();
                                 }
                                 else
                                 {
                                     disableLoginButton();
                                 }
                             }
    )
    $("input#ibox-stoken").on("input propertychange paste cut keydown keyup keypress",
                              function()
                              {
                                  if (checkOnTiebaInfoChange() === true)
                                  {
                                      enableLoginButton();
                                  }
                                  else
                                  {
                                      disableLoginButton();
                                  }
                              }
    )

    form.animate(
        {
            height: "380px"
        }
    );

    $("#dummy-container").fadeOut("fast",
                                  function()
                                  {
                                      $("#ibox-placeholder-container").attr("style", "visibility: hidden;");
                                      $("#ibox-tieba-id-container").fadeIn("fast");
                                      $("#ibox-bduss-container").fadeIn("fast");
                                      $("#ibox-stoken-container").fadeIn("fast");
                                  }
    );

    // Event binding - Phase 2
    // Form submission
    button.click(
        function()
        {
            submit();
        }
    );
}


function checkOnTiebaInfoChange()
{
    "use strict";

    const tieba_id = $("input#ibox-tieba-id").val().trim();
    const bduss = $("input#ibox-bduss").val().trim();
    const stoken = $("input#ibox-stoken").val().trim().toLowerCase();

    return checkOnUsernamePasswordChange() && tieba_id.length !== 0 && bduss.length === 192 && stoken.length === 64;
}


function checkTiebaInfo()
{
    "use strict";

    const tieba_id = $("input#ibox-tieba-id").val().trim();
    const bduss = $("input#ibox-bduss").val().trim();
    const stoken = $("input#ibox-stoken").val().trim().toLowerCase();

    const regex_bduss = /^[A-Za-z0-9\-]{192}$/;
    const regex_stoken = /^[a-f0-9]{64}$/;

    if (!checkUsernamePassword())
    {
        return false;
    }

    // Detect if blanked
    if (tieba_id === "" || bduss === "" || stoken === "" ||
        tieba_id === null || bduss === null || stoken === null ||
        tieba_id === undefined || bduss === undefined || stoken === undefined)
    {
        showLoginPrompt();
        showNotificationBarWithFading("请输入你的贴吧ID、BDUSS和STOKEN！", "error");
        return false;
    }

    if (!checkOnTiebaInfoChange() || regex_bduss.exec(bduss) === null || regex_stoken.exec(stoken) === null)
    {
        showNotificationBarWithFading("BDUSS或STOKEN格式错误，请重试！", "error");
        return false;
    }

    return true;
}


function submit()
{
    "use strict";
    if (checkTiebaInfo())
    {
        disableLoginButton();
        showNotificationBarWithFading("正在提交……");

        $.ajax(
            {
                async      : true,
                contentType: "application/json; charset=utf-8",
                method     : "POST",
                url        : API_ROOT,
                timeout    : TIMEOUT_MS,
                dataType   : "json",
                data       : JSON.stringify(
                    {
                        "authType": "1",
                        "username": $("input#ibox-uname").val().trim(),
                        "password": CryptoJS.MD5($("input#ibox-pwd").val().trim()).toString(),
                        "tiebaID" : $("input#ibox-tieba-id").val().trim(),
                        "bduss"   : RSA.encrypt($("input#ibox-bduss").val().trim()),
                        "sToken"  : RSA.encrypt($("input#ibox-stoken").val().trim())
                    }),
                success(data, textStatus)
                {
                    const json = data;

                    switch (json["code"])
                    {
                        case "0":
                            showNotificationBarWithFading("积分迁移已成功，帐户剩余积分：" + json["credit"] + "点");
                            break;
                        default:
                            showNotificationBarWithFading("服务器返回错误信息！", "error");
                            showNotificationBar(json["message"] +
                                                " (" +
                                                textStatus + ", " +
                                                json["code"].toString() +
                                                ")", "error");
                            enableLoginButton();
                            break;
                    }
                },
                error(jqXHR, textStatus, errorThrown)
                {
                    ajaxErrorHandler(jqXHR, textStatus, errorThrown);
                    enableLoginButton();
                }
            });
    }
    else
    {
        return false;
    }
}

// Event binding
$(document).ready(
    function()
    {
        const form_entity = $("form#login-form-entity");
        const button = $("input#btn-login");

        // Form action
        form_entity.change(
            function()
            {
                checkOnUsernamePasswordChange();
            }
        );

        // Input box action
        $("input#ibox-uname").on("input propertychange paste cut keydown keyup keypress",
                                 function()
                                 {
                                     if (checkOnUsernamePasswordChange() === true)
                                     {
                                         enableLoginButton();
                                     }
                                     else
                                     {
                                         disableLoginButton();
                                     }
                                 }
        )

        $("input#ibox-pwd").on("input propertychange paste cut keydown keyup keypress",
                               function()
                               {
                                   if (checkOnUsernamePasswordChange() === true)
                                   {
                                       enableLoginButton();
                                   }
                                   else
                                   {
                                       disableLoginButton();
                                   }
                               }
        )

        // Login button action
        button.click(
            function()
            {
                verifyUsernameAndPassword();
            }
        );
    }
);
