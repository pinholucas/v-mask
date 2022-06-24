(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.VueMask = {}));
})(this, (function (exports) { 'use strict';

  const placeholderChar = '_';
  const strFunction = 'function';

  const emptyArray$1 = [];
  function convertMaskToPlaceholder() {
    let mask = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : emptyArray$1;
    let placeholderChar$1 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : placeholderChar;

    if (!isArray(mask)) {
      throw new Error('Text-mask:convertMaskToPlaceholder; The mask property must be an array.');
    }

    if (mask.indexOf(placeholderChar$1) !== -1) {
      throw new Error('Placeholder character must not be used as part of the mask. Please specify a character ' + 'that is not present in your mask as your placeholder character.\n\n' + `The placeholder character that was received is: ${JSON.stringify(placeholderChar$1)}\n\n` + `The mask that was received is: ${JSON.stringify(mask)}`);
    }

    return mask.map(char => {
      return char instanceof RegExp ? placeholderChar$1 : char;
    }).join('');
  }
  function isArray(value) {
    return Array.isArray && Array.isArray(value) || value instanceof Array;
  }
  const strCaretTrap = '[]';
  function processCaretTraps(mask) {
    const indexes = [];
    let indexOfCaretTrap;

    while (indexOfCaretTrap = mask.indexOf(strCaretTrap), indexOfCaretTrap !== -1) {
      indexes.push(indexOfCaretTrap);
      mask.splice(indexOfCaretTrap, 1);
    }

    return {
      maskWithoutCaretTraps: mask,
      indexes
    };
  }

  const emptyArray = [];
  const emptyString = '';
  function conformToMask() {
    let rawValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : emptyString;
    let mask = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : emptyArray;
    let config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (!isArray(mask)) {
      if (typeof mask === strFunction) {
        mask = mask(rawValue, config);
        mask = processCaretTraps(mask).maskWithoutCaretTraps;
      } else {
        throw new Error('Text-mask:conformToMask; The mask property must be an array.');
      }
    }

    const {
      guide = true,
      previousConformedValue = emptyString,
      placeholderChar: placeholderChar$1 = placeholderChar,
      placeholder = convertMaskToPlaceholder(mask, placeholderChar$1),
      currentCaretPosition,
      keepCharPositions
    } = config;
    const suppressGuide = guide === false && previousConformedValue !== undefined;
    const rawValueLength = rawValue.length;
    const previousConformedValueLength = previousConformedValue.length;
    const placeholderLength = placeholder.length;
    const maskLength = mask.length;
    const editDistance = rawValueLength - previousConformedValueLength;
    const isAddition = editDistance > 0;
    const indexOfFirstChange = currentCaretPosition + (isAddition ? -editDistance : 0);
    const indexOfLastChange = indexOfFirstChange + Math.abs(editDistance);

    if (keepCharPositions === true && !isAddition) {
      let compensatingPlaceholderChars = emptyString;

      for (let i = indexOfFirstChange; i < indexOfLastChange; i++) {
        if (placeholder[i] === placeholderChar$1) {
          compensatingPlaceholderChars += placeholderChar$1;
        }
      }

      rawValue = rawValue.slice(0, indexOfFirstChange) + compensatingPlaceholderChars + rawValue.slice(indexOfFirstChange, rawValueLength);
    }

    const rawValueArr = rawValue.split(emptyString).map((char, i) => ({
      char,
      isNew: i >= indexOfFirstChange && i < indexOfLastChange
    }));

    for (let i = rawValueLength - 1; i >= 0; i--) {
      const {
        char
      } = rawValueArr[i];

      if (char !== placeholderChar$1) {
        const shouldOffset = i >= indexOfFirstChange && previousConformedValueLength === maskLength;

        if (char === placeholder[shouldOffset ? i - editDistance : i]) {
          rawValueArr.splice(i, 1);
        }
      }
    }

    let conformedValue = emptyString;
    let someCharsRejected = false;

    placeholderLoop: for (let i = 0; i < placeholderLength; i++) {
      const charInPlaceholder = placeholder[i];

      if (charInPlaceholder === placeholderChar$1) {
        if (rawValueArr.length > 0) {
          while (rawValueArr.length > 0) {
            const {
              char: rawValueChar,
              isNew
            } = rawValueArr.shift();

            if (rawValueChar === placeholderChar$1 && suppressGuide !== true) {
              conformedValue += placeholderChar$1;
              continue placeholderLoop;
            } else if (mask[i].test(rawValueChar)) {
              if (keepCharPositions !== true || isNew === false || previousConformedValue === emptyString || guide === false || !isAddition) {
                conformedValue += rawValueChar;
              } else {
                const rawValueArrLength = rawValueArr.length;
                let indexOfNextAvailablePlaceholderChar = null;

                for (let i = 0; i < rawValueArrLength; i++) {
                  const charData = rawValueArr[i];

                  if (charData.char !== placeholderChar$1 && charData.isNew === false) {
                    break;
                  }

                  if (charData.char === placeholderChar$1) {
                    indexOfNextAvailablePlaceholderChar = i;
                    break;
                  }
                }

                if (indexOfNextAvailablePlaceholderChar !== null) {
                  conformedValue += rawValueChar;
                  rawValueArr.splice(indexOfNextAvailablePlaceholderChar, 1);
                } else {
                  i--;
                }
              }

              continue placeholderLoop;
            } else {
              someCharsRejected = true;
            }
          }
        }

        if (suppressGuide === false) {
          conformedValue += placeholder.substr(i, placeholderLength);
        }

        break;
      } else {
        conformedValue += charInPlaceholder;
      }
    }

    if (suppressGuide && isAddition === false) {
      let indexOfLastFilledPlaceholderChar = null;

      for (let i = 0; i < conformedValue.length; i++) {
        if (placeholder[i] === placeholderChar$1) {
          indexOfLastFilledPlaceholderChar = i;
        }
      }

      if (indexOfLastFilledPlaceholderChar !== null) {
        conformedValue = conformedValue.substr(0, indexOfLastFilledPlaceholderChar + 1);
      } else {
        conformedValue = emptyString;
      }
    }

    return {
      conformedValue,
      meta: {
        someCharsRejected
      }
    };
  }

  const NEXT_CHAR_OPTIONAL = {
    __nextCharOptional__: true
  };
  const defaultMaskReplacers = {
    '#': /\d/,
    A: /[a-z]/i,
    N: /[a-z0-9]/i,
    '?': NEXT_CHAR_OPTIONAL,
    X: /./
  };

  const stringToRegexp = str => {
    const lastSlash = str.lastIndexOf('/');
    return new RegExp(str.slice(1, lastSlash), str.slice(lastSlash + 1));
  };

  const makeRegexpOptional = charRegexp => stringToRegexp(charRegexp.toString().replace(/.(\/)[gmiyus]{0,6}$/, match => match.replace('/', '?/')));

  const escapeIfNeeded = char => '[\\^$.|?*+()'.indexOf(char) > -1 ? `\\${char}` : char;

  const charRegexp = char => new RegExp(`/[${escapeIfNeeded(char)}]/`);

  const isRegexp$1 = entity => entity instanceof RegExp;

  const castToRegexp = char => isRegexp$1(char) ? char : charRegexp(char);

  function maskToRegExpMask(mask) {
    let maskReplacers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultMaskReplacers;
    return mask.map((char, index, array) => {
      const maskChar = maskReplacers[char] || char;
      const previousChar = array[index - 1];
      const previousMaskChar = maskReplacers[previousChar] || previousChar;

      if (maskChar === NEXT_CHAR_OPTIONAL) {
        return null;
      }

      if (previousMaskChar === NEXT_CHAR_OPTIONAL) {
        return makeRegexpOptional(castToRegexp(maskChar));
      }

      return maskChar;
    }).filter(Boolean);
  }

  function stringMaskToRegExpMask(stringMask) {
    let maskReplacers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultMaskReplacers;
    return maskToRegExpMask(stringMask.split(''), maskReplacers);
  }
  function arrayMaskToRegExpMask(arrayMask) {
    let maskReplacers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultMaskReplacers;
    const flattenedMask = arrayMask.map(part => {
      if (part instanceof RegExp) {
        return part;
      }

      if (typeof part === 'string') {
        return part.split('');
      }

      return null;
    }).filter(Boolean).reduce((mask, part) => mask.concat(part), []);
    return maskToRegExpMask(flattenedMask, maskReplacers);
  }

  const trigger = (el, type) => {
    const e = document.createEvent('HTMLEvents');
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
  };
  const queryInputElementInside = el => el instanceof HTMLInputElement ? el : el.querySelector('input') || el;
  const isFunction = val => typeof val === 'function';
  const isString = val => typeof val === 'string';
  const isRegexp = val => val instanceof RegExp;

  function parseMask(inputMask, maskReplacers) {
    if (Array.isArray(inputMask)) {
      return arrayMaskToRegExpMask(inputMask, maskReplacers);
    }

    if (isFunction(inputMask)) {
      return inputMask;
    }

    if (isString(inputMask) && inputMask.length > 0) {
      return stringMaskToRegExpMask(inputMask, maskReplacers);
    }

    return inputMask;
  }

  function createOptions() {
    const elementOptions = new Map();
    const defaultOptions = {
      previousValue: '',
      mask: []
    };

    function get(el) {
      return elementOptions.get(el) || { ...defaultOptions
      };
    }

    function partiallyUpdate(el, newOptions) {
      elementOptions.set(el, { ...get(el),
        ...newOptions
      });
    }

    function remove(el) {
      elementOptions.delete(el);
    }

    return {
      partiallyUpdate,
      remove,
      get
    };
  }

  function extendMaskReplacers(maskReplacers) {
    let baseMaskReplacers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultMaskReplacers;

    if (maskReplacers === null || Array.isArray(maskReplacers) || typeof maskReplacers !== 'object') {
      return baseMaskReplacers;
    }

    return Object.keys(maskReplacers).reduce((extendedMaskReplacers, key) => {
      const value = maskReplacers[key];

      if (value !== null && !(value instanceof RegExp)) {
        return extendedMaskReplacers;
      }

      return { ...extendedMaskReplacers,
        [key]: value
      };
    }, baseMaskReplacers);
  }

  const options = createOptions();

  function triggerInputUpdate(el) {
    trigger(el, "input");
  }

  function updateValue(el) {
    let force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    const {
      value
    } = el;
    const {
      previousValue,
      mask
    } = options.get(el);
    const isValueChanged = value !== previousValue;
    const isLengthIncreased = value.length > previousValue.length;
    const isUpdateNeeded = value && isValueChanged && isLengthIncreased;

    if ((force || isUpdateNeeded) && mask) {
      const {
        conformedValue
      } = conformToMask(value, mask, {
        guide: false
      });
      el.value = conformedValue;
      triggerInputUpdate(el);
    }

    options.partiallyUpdate(el, {
      previousValue: value
    });
  }

  function updateMask(el, inputMask, maskReplacers) {
    const mask = parseMask(inputMask, maskReplacers);
    options.partiallyUpdate(el, {
      mask
    });
  }

  function maskToString(mask) {
    const maskArray = Array.isArray(mask) ? mask : [mask];
    const filteredMaskArray = maskArray.filter(part => isString(part) || isRegexp(part));
    return filteredMaskArray.toString();
  }

  function createDirective() {
    let directiveOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const instanceMaskReplacers = extendMaskReplacers(directiveOptions && directiveOptions.placeholders);
    return {
      beforeMount(el, _ref) {
        let {
          value
        } = _ref;
        el = queryInputElementInside(el);
        updateMask(el, value, instanceMaskReplacers);
        updateValue(el);
      },

      updated(el, _ref2) {
        let {
          value,
          oldValue
        } = _ref2;
        el = queryInputElementInside(el);
        const isMaskChanged = isFunction(value) || maskToString(oldValue) !== maskToString(value);

        if (isMaskChanged) {
          updateMask(el, value, instanceMaskReplacers);
        }

        updateValue(el, isMaskChanged);
      },

      unmounted(el) {
        el = queryInputElementInside(el);
        options.remove(el);
      }

    };
  }
  var directive = createDirective();

  var plugin = (function (Vue) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    Vue.directive("mask", createDirective(options));
  });

  exports.VueMaskDirective = directive;
  exports.VueMaskPlugin = plugin;
  exports["default"] = plugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
