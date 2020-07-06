Element.prototype.drag = function () {
    var mousemove = function (e) {
        // document mousemove

        // page cursor position (px)
        console.log(e.clientX, e.clientY);
        console.log(e);

        // this.style.left = e.clientX - this.dragStartX + "px";
        this.style.bottom = e.clientY + this.dragStartY + "px";
    }.bind(this);

    var mouseup = function (e) {
        // document mouseup

        document.removeEventListener("mousemove", mousemove);
        document.removeEventListener("mouseup", mouseup);
    }.bind(this);

    this.addEventListener(
        "mousedown",
        function (e) {
            // element mousedown

            // initial click position on element (px)
            this.dragStartX = e.offsetX;
            this.dragStartY = e.offsetY;

            // console.log(this.dragStartX, this.dragStartY);

            document.addEventListener("mousemove", mousemove);
            document.addEventListener("mouseup", mouseup);
        }.bind(this)
    );
};

class Control {
    STATE_DISABLED = 0;
    STATE_UPDATING = 1;
    STATE_TRANSMIT = 2;

    constructor(selector, controller, label, options) {
        this.selector = selector;
        this.controller = controller;
        this.label = label;
        this.options = options;

        this.state = this.STATE_UPDATING;

        this.draw_base();
        this.update(0); // set default value to 0
    }

    update(value) {
        console.trace();
        console.log("Not yet implemented");
    }

    draw_base() {
        this.control = $(this.selector).addClass("sp-control");
    }
}

class Handle extends Control {
    constructor(selector, controller, label, options, callbackMouseUp) {
        super(selector, controller, label, options);

        this.draw();
        if (callbackMouseUp !== undefined) this.addDragging(callbackMouseUp);
        this.update(0);
    }

    update(value, label) {
        if (value != undefined) {
            if (label !== undefined) {
                this.label = label;
            }

            if (this.state === this.STATE_UPDATING) this.updateValue(value);
        }
    }

    bottom2value(bottom) {
        // value is float -1.0 -> 1.0
        // options.zero = 'top' | 'mid' | 'bot'
        // up is always positive
        // Grip range is calc(0%  + 10px + 5px) to calc(90% - 10px - 5px)

        var value;
        var position = (bottom - 10) / (this._controlHeight - 15);

        if (this.options.zero == "top") value = 1.0 - position;
        else if (this.options.zero == "mid") value = (position - 0.5) * 2;
        else value = position;

        return Math.round(value * 1000) / 1000;
    }

    value2bottom(value) {
        // value is float -1.0 -> 1.0
        // options.zero = 'top' | 'mid' | 'bot'
        // up is always positive
        // Grip range is calc(0%  + 10px + 5px) to calc(90% - 10px - 5px)

        var position; // 0 -> 100 %

        if (this.options.zero == "top") position = 1.0 - value;
        else if (this.options.zero == "mid") position = value / 2 + 0.5;
        else position = value;

        // @height = 130px
        // range: 10px -> 125px

        return 10 + (this._controlHeight - 15) * position;
    }

    updateValue(value) {
        // value is float -1.0 -> 1.0
        $(`${this.selector} .grip`).css(
            "bottom",
            this.value2bottom(value) + "px"
        );
    }

    draw() {
        var colour = this.options.colour;
        this.control.addClass("handle");
        this.control.append(
            $("<div class='panel'></div>"),
            $("<div class='gap'></div>"),
            $("<div class='grip'></div>")
        );
        this.control.find(".grip").each(function (idx) {
            $(this).css("background-color", colour);
        });
        this._controlHeight = $(`${this.selector} .gap`)
            .css("height")
            .slice(0, -2);
    }

    addDragging(callbackMouseUp) {
        // add dragging

        var _handle = this;

        console.log(_handle);

        function mouseDown(_grip) {
            _handle.state = _handle.STATE_TRANSMIT;
            $("body").addClass("sp-grabbing");
            $(_grip).addClass("noTransitions");
        }
        function mouseMove(_grip) {
            callbackMouseUp(
                _handle.bottom2value($(_grip).css("bottom").slice(0, -2))
            );
        }
        function mouseUp(_grip) {
            $("body").removeClass("sp-grabbing");
            $(_grip).removeClass("noTransitions");
            _handle.state = _handle.STATE_UPDATING;
        }

        // this.drag(mouseDown, mouseMove, mouseUp);

        $(`${this.selector} .grip`).mousedown(function (e) {
            var _grip = this;

            // element mousedown
            mouseDown(_grip);

            // initial click position on element (px)
            this.dragStartX = e.offsetX;
            this.dragStartY =
                e.pageY -
                e.offsetY +
                Number($(_grip).css("bottom").slice(0, -2));

            $(document).mousemove(function (e) {
                var dy = e.clientY - _grip.dragStartY;

                var grip_position = Math.min(
                    Math.max(-dy, 10),
                    _handle._controlHeight - 5
                );

                $(_grip).css("bottom", grip_position + "px");
                mouseMove(_grip);
            });

            $(document).mouseup(function (e) {
                $(document).unbind("mousemove");
                $(document).unbind("mouseup");
                mouseUp(_grip);
            });
        });
    }
}

class Level extends Control {
    constructor(selector, controller, label, options) {
        super(selector, controller, label, options);

        this.draw();
    }

    update(value) {
        // value is float 0.0 -> 1.0
        // up is always positive
        $(`${this.selector} .contents`).css("height", value * 100 + "%");
    }

    draw() {
        this.control.addClass("level").addClass(this.options.contents);
        this.control.append(
            $("<div class='backing'></div>").append(
                $("<div class='contents'></div>"),
                $("<div class='glass'></div>")
            )
        );

        // <div id="level-tank" class="sp-control level water">
        //     <div class="backing">
        //         <div class="contents"></div>
        //         <div class="glass"></div>
        //     </div>
        // </div>
    }
}
