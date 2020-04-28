function data() {
    return {
        tab: 'hide',
        hide: {
            secretData: 'Tấn công lúc bình minh',
            content: 'Hôm nay quả là một ngày đẹp trời :3 :3',
            result: '',
            submit() {
                const converted = convertString(this.secretData)
                this.result = `‎${converted}‏${this.content}`
            },
            clear() {
                this.secretData = ''
                this.content = ''
                this.result = ''
            }
        },
        encrypt: {
            secretData: 'Tấn công lúc bình minh',
            password: '123456',
            content: 'Hôm nay quả là một ngày đẹp trời :3 :3',
            result: '',
            error: '',
            async submit() {
                try {
                    // Tạo khóa
                    let saltBuffer = getRandomArrayBuffer(32);
                    const iterations = 100000;
                    let keyMaterial = await getKeyMaterial(this.password);
                    let key = await getKey(saltBuffer, keyMaterial, iterations);

                    // Mã hóa
                    let dataBuffer = new TextEncoder().encode(this.secretData);
                    let ivBuffer = getRandomArrayBuffer(12);
                    let encryptedBuffer = await encryptMessage(dataBuffer, key, ivBuffer);

                    const encryptedData = JSON.stringify({
                        salt: byteArrToHexString(saltBuffer),
                        iterations: iterations,
                        iv: byteArrToHexString(ivBuffer),
                        encryptedData: byteArrToHexString(encryptedBuffer)
                    })

                    console.log(encryptedData)

                    const converted = convertString(encryptedData)
                    console.log(converted)
                    this.result = `‎${converted}‏${this.content}`
                } catch (e) {
                    this.error = e
                    console.log(e)
                }
            },
            clear() {
                this.secretData = ''
                this.password = ''
                this.content = ''
                this.result = ''
                this.error = ''
            }
        },
        reveal: {
            content: '',
            result: '',
            submit() {
                const regex = /‎(.*?)‏/g;
                const matches = this.content.matchAll(regex);
                const matchesArr = [...matches]

                if (matchesArr) {
                    const results = []
                    matchesArr.forEach((match) => {
                        results.push(convertBackString(match[1]))
                    })

                    this.result = results.join('\n\n')
                } else {
                    this.result = ''
                }
            },
            clear() {
                this.content = ''
                this.result = ''
            }
        },
        decrypt: {
            password: '',
            content: '',
            result: '',
            error: '',
            async submit() {
                const regex = /‎(.*?)‏/g;
                const matches = this.content.matchAll(regex);
                const matchesArr = [...matches]

                if (matchesArr) {
                    const results = []
                    await asyncForEach(matchesArr, async (match) => {
                        const unconverted = convertBackString(match[1])
                        try {
                            const obj = JSON.parse(unconverted)

                            if (obj.hasOwnProperty('encryptedData')) {
                                try {
                                    const result = await doDecrypt(obj, this.password)

                                    results.push(result)
                                } catch (e) {
                                    results.push('[Sai mật khẩu]')
                                    console.log(e)
                                }
                            } else {
                                results.push('[Không bị mã hóa]')
                            }
                        } catch (e) {
                            results.push('[Không bị mã hóa]')
                            console.log(e)
                        }
                    })

                    this.result = results.join('\n\n')
                } else {
                    this.result = ''
                }
            },
            clear() {
                this.password = ''
                this.content = ''
                this.result = ''
                this.error = ''
            }
        }
    }
}

const submit_convert = (content, secretData) => {
    const converted = convertString(secretData)
    return `‎${converted}‏${content}`
}

const submit_revert = (content) => {
    const regex = /‎(.*?)‏/g;
    const matches = content.matchAll(regex);
    const matchesArr = [...matches]

    if (matchesArr) {
        const results = []
        matchesArr.forEach((match) => {
            results.push(convertBackString(match[1]))
        })

        return results.join('\n\n')
    } else {
        return ''
    }
}

const convertString = (str) => {
    return binArrToZWCString(byteArrToBinArr(strToByteArr(str)))
}

const convertBackString = (zwdStr) => {
    const binArr = zwdStr
        .split('')
        .map(c => {
            if (c == '‌') return '0'
            if (c == '​') return '1'
        })
    const byteArr = chunk(binArr, 8)
        .map(bitArr => bitArr.join(''))
        .map(bitStr => parseInt(bitStr, 2))
    const bufferView = new Uint8Array(byteArr)
    return new TextDecoder().decode(bufferView)
}

const doDecrypt = async (encObj, password) => {
    // Parse đoạn JSON chứa các thông tin
    let dataBuffer = hexStrToByteArray(encObj.encryptedData);
    let saltBuffer = hexStrToByteArray(encObj.salt);
    let ivBuffer = hexStrToByteArray(encObj.iv);
    const iterations = encObj.iterations;

    // Tạo key
    let keyMaterial = await getKeyMaterial(password);
    let key = await getKey(saltBuffer, keyMaterial, iterations);

    // Giải mã
    const decryptedBuffer = await decryptMessage(dataBuffer, key, ivBuffer);
    return new TextDecoder("utf-8").decode(decryptedBuffer);
}

const strToByteArr = (str) => {
    return new TextEncoder().encode(str)
}

const byteArrToBinArr = (byteArr) => {
    const bufferView = new Uint8Array(byteArr)
    return Array.from(bufferView)
        .map((dec) => decimalToBinary(dec).split(''))
        .flat()
}

const binArrToZWCString = (binArr) => {
    return binArr
        .map(bin => {
            if (bin == 0) return '‌'
            if (bin == 1) return '​'
        })
        .join('')
}

const decimalToBinary = (d) => {
    var b = ''
    for (var i = 0; i < 8; i++) {
        b = (d % 2) + b
        d = Math.floor(d / 2)
    }
    return b
}

const chunk = (array, size) => {
    const chunked_arr = [];
    let index = 0;
    while (index < array.length) {
        chunked_arr.push(array.slice(index, size + index));
        index += size;
    }
    return chunked_arr;
}

const byteArrToHexString = byteArray => {
    var bufferView = new Uint8Array(byteArray);
    return Array.prototype.map.call(bufferView, function (byte) {
        return ("0" + (byte & 0xFF).toString(16)).slice(-2);
    }).join("");
};

const hexStrToByteArray = hexString => {
    var result = [];
    while (hexString.length >= 2) {
        result.push(parseInt(hexString.substring(0, 2), 16));
        hexString = hexString.substring(2, hexString.length);
    }
    return new Uint8Array(result);
};

const getRandomArrayBuffer = bytesNumber => {
    let byte = new Uint8Array(bytesNumber);
    crypto.getRandomValues(byte);
    return byte;
};

const getKeyMaterial = async (passwordString) => {
    const passwordBuffer = new TextEncoder().encode(passwordString);
    return await crypto.subtle.importKey("raw", passwordBuffer, {name: "PBKDF2"}, false, ["deriveBits", "deriveKey"]);
};

const getKey = async (saltBuffer, keyMaterial, iterations) => {
    let params = {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000,
        hash: "SHA-256"
    };
    return await crypto.subtle.deriveKey(
        params,
        keyMaterial,
        {name: "AES-GCM", length: 256},
        true,
        ["encrypt", "decrypt"]
    );
};

const encryptMessage = async (dataBuffer, key, ivBuffer) => {
    return await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: ivBuffer
        },
        key,
        dataBuffer
    );
}

const decryptMessage = async (encryptedDataBuffer, key, ivBuffer) => {
    return await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBuffer
        },
        key,
        encryptedDataBuffer
    );
}

const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}
