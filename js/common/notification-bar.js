let t;
const DELAY_MS = 2000;

function showNotificationBarWithFading(msg, mode)
{
    "use strict";
    const bar = showNotificationBar(msg, mode);
    t = setTimeout(
        function()
        {
            try
            {
                closeNotificationBar(bar, "onTimeout");
            }
            catch (e) {}
        }, DELAY_MS);
}

function showNotificationBar(msg, mode)
{
    "use strict";
    const container = $("p#notification-container-inner");
    const bar = document.createElement("div");
    const closeBtn = document.createElement("span");

    if (mode === "error")
    {
        bar.className = "notification-bar notification-bar-error";
    }
    else
    {
        bar.className = "notification-bar";
    }

    closeBtn.className = "btn-close-notification";
    $(closeBtn).click(
        function(e)
        {
            closeNotificationBar(bar, "onClick", e);
        }
    );
    bar.innerHTML = msg;
    closeBtn.innerHTML = "×";

    container.append(bar);
    bar.appendChild(closeBtn);

    $(bar).fadeIn(500);

    return bar;
}

function closeNotificationBar(bar, mode, event)
{
    "use strict";
    let timing = 1500;

    if (mode === "onClick")
    {
        timing = 500;
        clearTimeout(t);
        event.stopPropagation();
    }
    $(bar).fadeOut(timing);
    setTimeout(
        function()
        {
            try
            {
                bar.parentNode.removeChild(bar);
            }
            catch (e) {}
        }, timing
    );
}
