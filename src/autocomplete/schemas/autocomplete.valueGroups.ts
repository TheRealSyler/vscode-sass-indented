export const positionValues = [
    {name: "bottom", desc: "Computes to ‘100%’ for the vertical position if one or two values are given, otherwise specifies the bottom edge as the origin for the next offset."},
    {name: "center", desc: "Computes to ‘50%’ (‘left 50%’) for the horizontal position if the horizontal position is not otherwise specified, or ‘50%’ (‘top 50%’) for the vertical position if it is."},
    {name: "left", desc: "Computes to ‘0%’ for the horizontal position if one or two values are given, otherwise specifies the left edge as the origin for the next offset."},
    {name: "right", desc: "Computes to ‘100%’ for the horizontal position if one or two values are given, otherwise specifies the right edge as the origin for the next offset."},
    {name: "top", desc: "Computes to ‘0%’ for the vertical position if one or two values are given, otherwise specifies the top edge as the origin for the next offset."},
];

export const repeatValues = [
    {name: "no-repeat", desc: "Placed once and not repeated in this direction."},
    {name: "repeat", desc: "Repeated in this direction as often as needed to cover the background painting area."},
    {name: "repeat-x", desc: "Computes to ‘repeat no-repeat’."},
    {name: "repeat-y", desc: "Computes to ‘no-repeat repeat’."},
    {name: "round", desc: "Repeated as often as will fit within the background positioning area. If it doesn’t fit a whole number of times, it is rescaled so that it does."},
    {name: "space", desc: "Repeated as often as will fit within the background positioning area without being clipped and then the images are spaced out to fill the area."},
];

export const lineStyleValues = [
    {name: "dashed", desc: "A series of square-ended dashes."},
    {name: "dotted", desc: "A series of round dots."},
    {name: "double", desc: "Two parallel solid lines with some space between them."},
    {name: "groove", desc: "Looks as if it were carved in the canvas."},
    {name: "hidden", desc: "Same as ‘none’, but has different behavior in the border conflict resolution rules for border-collapsed tables."},
    {name: "inset", desc: "Looks as if the content on the inside of the border is sunken into the canvas."},
    {name: "none", desc: "No border. Color and width are ignored."},
    {name: "outset", desc: "Looks as if the content on the inside of the border is coming out of the canvas."},
    {name: "ridge", desc: "Looks as if it were coming out of the canvas."},
    {name: "solid", desc: "A single line segment."},
];

export const lineWidthValues = [
    {name: "medium"},
    {name: "thick"},
    {name: "thin"},
];