# Style Guide

## Client
### ReactNative / JS
- Soft tabs and 2 spaces for a tab
- Use `var` and not `let`
- 80 characters as max width

```JavaScript
function cherries() {
    if (true) {
        var friends = ["Gabi", "Adam", "Ender"]; // function scope
    }
    for (const friend of friends) {
        let friendo = friend; // block scope
    }
    friends += "Kevin";
    if (friendo == "Kevin") { // error
        smile :)
    }
}
```

Language References:
- [Basics](https://observablehq.com/@nyuvis/javascript-basics?collection=@nyuvis/guides-and-examples)
- [Practice Basics](https://observablehq.com/@nyuvis/javascript-basics-practice?collection=@nyuvis/practice-exercises)
- [Language Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)

## Server
### Golang
- Soft tabs with 4 spaces as a tab
- 100 character max width

Language References:
- [Website](https://golang.org)
- [Tour](https://tour.golang.org/)
- [Language Reference](https://golang.org/ref/spec)
- [Standard Library Reference](https://pkg.go.dev/std)

### Possible calls into C
- 80 character max width
- Soft tabs with 4 spaces as a tab

## Testing
### Shell scripts
- 80 characters
- 4 soft spaces

Language Reference
- [Bash Scripting Reference](https://medium.com/sysf/bash-scripting-everything-you-need-to-know-about-bash-shell-programming-cd08595f2fba)

### python3 with requests module
- 1 class per file
- 4 soft spaces
- 80 character max width

Language Reference:
- [Language Reference](https://docs.python.org/3/reference/index.html)
- [Library Reference](https://docs.python.org/3/library/index.html)
- [Requests Module](https://docs.python-requests.org/en/master/index.html)
