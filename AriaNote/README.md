# Aria's notes for CS-GY 6903

Hi please do not share these without my consent. It's fine if you direct them to this GH repo, but I
ask that you do not copy my work (especially removing the copyright because that is mean and then
I'd have to sue you). For students in this class, I ask that you do not use these on the midterm
because they are not allowed. If you do, I ask that you cite this.

### Usage

To copy this to your computer, assuming git is installed and an SSH key is associated with a GitHub account:

```bash
git clone git@github.com:ariadiamond/cs6903_project2.git
cd cs6903_project2
git checkout ariaNote
cd AriaNote
```

If you do **not** have an SSH key on your GitHub (or don't want to use it), follow these steps instead:

```bash
git clone https://github.com/ariadiamond/cs6903_project2.git
cd cs6903_project2
git checkout ariaNote
cd AriaNote
```

Once doing this, open `Notes.html` in your browswer of choice.

### Libraries Used
- [Mathjax](https://www.mathjax.org). A library that converts Latex in html to pretty views of math
- [D3.js](https://d3js.org). A visualization library that I use to show mapping of characters in mono-alphabetic shift ciphers and Vigenere.
- [aes-js](https://github.com/ricmoo/aes-js). An implementation of AES in JavaScript, with a the varios modes implemented.
- [scrypt-js](https://github.com/ricmoo/scrypt-js). An implementation of scrypt in JavaScript that I use to convert to passwords to AES keys.

### Todo

- [ ] Fix algorithms to build RSA + mathmatical theory behind them.
    - Currently there is a video that explains this at the end of the lecture.
- [ ] Finish notes on MACs
