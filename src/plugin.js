import { createDirective } from "./directive";

/**
 * Vue plugin definition
 * @param {Vue} Vue
 * @param {Object}       options
 * @param {MaskReplaces} options.placeholders
 */
export default (Vue, options = {}) => {
  Vue.directive("mask", createDirective(options));
};
