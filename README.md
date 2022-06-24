# :abcd: Vue input mask

![npm bundle size](https://img.shields.io/bundlephobia/minzip/v-mask)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/probil/v-mask/master/LICENSE)
[![Vue3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)

> Tiny input mask library for Vue 3. No dependencies.

## :warning: Features removed

Since Vue 3 doesn't supports filter anymore (you should use the computed approach), the filter feature has been removed.

## :cd: Installation

This version requires Vue 3.

```sh
npm install v-mask
```

## Initialization

### ES2015 (Webpack/Rollup/Browserify/etc)

````javascript
import Vue from 'vue'

import VueMask from 'v-mask'
Vue.use(VueMask);

// Or as a directive-only
import { VueMaskDirective } from 'v-mask'
app.directive('mask', VueMaskDirective);

## :rocket: Usage

```html
<input type="text" v-mask="'####-##'" v-model="myInputModel">
<!-- OR -->
<input type="text" v-mask="variableWithMask" v-model="myInputModel">
````

**Notice:** `v-model` is required starting from `v1.1.0`, because [a lot](https://github.com/probil/v-mask/issues/16) [of](https://github.com/probil/v-mask/issues/30) [bugs](https://github.com/probil/v-mask/issues/29) with HTMLElement event listeners and sync with Vue internals.

There is no reason to support using this lib for using without `v-model` but open the door for using on [custom inputs](http://vuejs.org/v2/guide/components.html#Form-Input-Components-using-Custom-Events).

## :gear: Configuration

Library provides several ways to apply the mask.

The first and the easiest one is to use default placeholders.

### Default placeholders

This approach is good for simple cases. No configuration is required.

`app.js`:

```js
import { createApp } from "vue";
import VueMask from "v-mask";

const app = createApp({});

app.use(VueMask);
```

`<your_component>.vue`:

```vue
<template>
  <input type="text" v-mask="'####-##'" v-model="myInputModel" />
</template>
<script>
export default {
  data: () => ({
    myInputModel: "",
  }),
};
</script>
```

Entering `56f473d4` in the input field will produce value `5647-34` in `myInputModel` variable.

Here is a list placeholders you can utilize by default:

| Placeholder | Format                         |
| ----------- | ------------------------------ |
| #           | Number (0-9)                   |
| A           | Letter in any case (a-z,A-Z)   |
| N           | Number or letter (a-z,A-Z,0-9) |
| X           | Any symbol                     |
| ?           | Optional (next character)      |

### Custom placeholders

While default placeholders are easy to use and straightforward, in reality we have to deal with more complex cases where validation can be tricky and unpredictable. In such cases it makes sense to define custom placeholders specific to the project or the domain.

To define them you should pass them as an object while installing plugin. Where:

- `key` is the character in a mask
- `value` is regular expression used to verify entered symbol

You can disable any default placeholder by passing placeholder as a key and `null` as a value.

Any valid string character can be used as a placeholder (e.g. Cyrillic or Arabic)

`app.js`:

```js
import VueMask from "v-mask";

app.use(VueMask, {
  // (!) custom placeholders support requires registration as a plugin to
  placeholders: {
    "#": null, // passing `null` removes default placeholder, so `#` is treated as character
    D: /\d/, // define new placeholder
    Я: /[\wа-яА-Я]/, // cyrillic letter as a placeholder
  },
});
```

`<your_component>.vue`:

```vue
<template>
  <input type="text" v-mask="'###-DDD-###-DDD'" v-model="myInputModel" />
</template>
<script>
export default {
  data: () => ({
    myInputModel: "",
  }),
};
</script>
```

Entering `123456` in that input field will produce value `###-123-###-456` in `myInputModel` variable.

### Array of RegExp

In some cases you might not want to define global placeholders either because you are dealing with unique input or you are facing conflicts for placeholders in several places.

In such cases you can supply array of per-char regular expressions or static characters to `v-mask`.

`app.js`:

```js
import VueMask from "v-mask";
app.use(VueMask);
```

`<your_component>.vue`:

```vue
<template>
  <input type="text" v-mask="mask" v-model="myInputModel" />
</template>
<script>
export default {
  data: () => ({
    mask: [
      "(",
      /\d/,
      /\d/,
      /\d/,
      ") ",
      /\d/,
      /\d/,
      /\d/,
      "-",
      /\d/,
      /\d/,
      /\d/,
      /\d/,
    ],
    myInputModel: "",
  }),
};
</script>
```

In this example entering `5555551234` in the input field will produce value `(555) 555-1234` in `myInputModel` variable.

**Notice**: Keep in mind that library always verifies _one_ character per regular expression. Trying to verify multiple charters in the same RegExp won't work.

### Function

If custom placeholder and array of RegExps can't fit your needs there is one more way you can use to mask a value.
The idea beneath is that you can write a function that is used by library to format the output.

This approach is super powerful but also more complex to write and understand so try previous ones first.

The function will be given a value from the input. It should return array of per-char regular expressions & static characters:

`app.js`:

```js
import VueMask from "v-mask";
app.use(VueMask);
```

`<your_component>.vue`:

```vue
<template>
  <input
    type="text"
    v-mask="timeRangeMask"
    v-model="myInputModel"
    placeholder="00:00-23:59"
  />
</template>
<script>
/**
 * Generate a time mask based on input value (23:59)
 * @param {string} value
 */
export function timeMask(value) {
  const hours = [/[0-2]/, value.charAt(0) === "2" ? /[0-3]/ : /[0-9]/];
  const minutes = [/[0-5]/, /[0-9]/];
  return value.length > 2 ? [...hours, ":", ...minutes] : hours;
}

/**
 * Generate a time range mask based on input value (00:00-23:59)
 * @param {string} value
 */
export function timeRangeMask(value) {
  const numbers = value.replace(/[^0-9]/g, "");
  if (numbers.length > 4) {
    return [
      ...timeMask(numbers.substring(0, 4)),
      "-",
      ...timeMask(numbers.substring(4)),
    ];
  }
  return [...timeMask(numbers)];
}

export default {
  data: () => ({
    timeRangeMask,
    myInputModel: "",
  }),
};
</script>
```

In this example entering `02532137` in the input field will produce valid time range `02:53-21:37` in `myInputModel` variable.

### Text Mask Addons

Library supports [Text Mask Addons](https://www.npmjs.com/package/text-mask-addons), they are basically pre-generated functions (describe above) for advanced functionality like currency masking.

The usage is simple. Configure the addon as you want and pass the result to the `v-mask` as you would to `text-mask-core`.

`app.js`:

```js
import VueMask from "v-mask";
app.use(VueMask);
```

`<your_component>.vue`:

```vue
<template>
  <input
    type="text"
    v-mask="currencyMask"
    v-model="myInputModel"
    placeholder="$100.00"
  />
</template>
<script>
import createNumberMask from "text-mask-addons/dist/createNumberMask";
const currencyMask = createNumberMask({
  prefix: "$",
  allowDecimal: true,
  includeThousandsSeparator: true,
  allowNegative: false,
});
export default {
  data: () => ({
    currencyMask,
    myInputModel: "",
  }),
};
</script>
```

In this example:

- entering `1000000.00` in the input field will produce `$1,000,000.00` in `myInputModel` variable
- while entering `100` in the input field will produce `$100`

View the [createNumberMask](https://github.com/text-mask/text-mask/tree/master/addons/#createnumbermask) documentation for a full list of options available.

## :syringe: Tests

[Jest](https://github.com/facebook/jest) is used for unit-tests.

Unit-tests can be executed by typing this command in your terminal:

```bash
npm test
```

[TestCafe](https://github.com/DevExpress/testcafe) is used of E2E testing.

E2E-tests can be executed by typing this command in your terminal:

```bash
npm test:e2e
```

## :anchor: Semantic Versioning Policy

This plugin follows [semantic versioning](http://semver.org/).

## :lock: License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).
