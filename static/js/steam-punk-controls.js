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
    constructor(selector, label, options) {
        this.selector = selector;
        this.label = label;
        this.options = options;

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
    constructor(selector, label, options) {
        super(selector, label, options);

        this.draw();
        this.update(0);
    }

    update(value, label) {
        // value is float -1.0 -> 1.0
        // options.zero = 'top' | 'mid' | 'bot'
        // up is always positive
        // Grip range is calc(0%  + 10px + 5px) to calc(90% - 10px - 5px)

        var yPos; // 0 -> 100 %

        if (label !== undefined) {
            this.label = label;
        }

        if (this.options.zero == "top") yPos = 1.0 - value;
        else if (this.options.zero == "mid") yPos = value / 2 + 0.5;
        else yPos = value;

        // @height = 130px
        // range: 10px -> 125px

        $(`${this.selector} .grip`).css(
            "bottom",
            10 + (this._controlHeight - 15) * yPos + "px"
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
            // this.drag();
        });
        this._controlHeight = $(`${this.selector} .gap`)
            .css("height")
            .slice(0, -2);
    }
}

class Level extends Control {
    constructor(selector, label, options) {
        super(selector, label, options);

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
