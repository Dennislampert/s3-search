function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
}

export const uniqueId = () => {
    const y = new Date().getTime();
    const list = ['a', 'b', 'c', 'd', 'x', 'y', 't'];
    const min = 0;
    const x = Math.round(Math.random() * ((list.length -1 ) - min)) + min;
    const z = Math.round(Math.random() * ((list.length -1 ) - min)) + min;
    const a = Math.round(Math.random() * ((list.length -1 ) - min)) + min;
    const b = Math.round(Math.random() * ((list.length -1 ) - min)) + min;
    const joker = Math.round(Math.random() * (9 - min)) + min;
    const id = shuffle([joker, list[x], list[a], a, list[b], y, b, x, list[z]]);
    // console.log('generated id: ',id);
    return id.join('');
};


const unique = [];
const test = () => {
    for (var i = 0; i < 1000; i++) {
        const id = uniqueId();
        if (unique.indexOf(uniqueId(id)) > -1) {
            console.log('already exists::::::',id);
        } else {
            unique.push(id);
        }
    }
}
function runtest() {
    
    for (var i = 0; i < 100; i++) {
        test();
        test();
        test();
        test();
        test();
        test();
        test();
        test();
    }
}

// runtest();