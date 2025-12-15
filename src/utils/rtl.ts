import { ViewStyle, TextStyle } from 'react-native';
import { getIsRTL } from '../i18n/config';

/**
 * Get the text alignment for RTL/LTR languages
 * @returns 'left' for LTR, 'right' for RTL
 */
export const getTextAlign = (): 'left' | 'right' | 'center' => {
  return getIsRTL() ? 'right' : 'left';
};

/**
 * Get the flex direction for RTL/LTR languages
 * @returns 'row-reverse' for RTL, 'row' for LTR
 */
export const getFlexDirection = (): 'row' | 'row-reverse' | 'column' | 'column-reverse' => {
  return getIsRTL() ? 'row-reverse' : 'row';
};

/**
 * Get alignment for RTL/LTR languages
 * @returns 'flex-end' for RTL, 'flex-start' for LTR
 */
export const getHorizontalAlign = (): 'flex-start' | 'flex-end' | 'center' => {
  return getIsRTL() ? 'flex-end' : 'flex-start';
};

/**
 * Get opposite alignment for RTL/LTR languages
 * @returns 'flex-start' for RTL, 'flex-end' for LTR
 */
export const getOppositeHorizontalAlign = (): 'flex-start' | 'flex-end' | 'center' => {
  return getIsRTL() ? 'flex-start' : 'flex-end';
};

/**
 * Get margin values that respect RTL direction
 * Use marginStart/marginEnd instead of marginLeft/marginRight
 */
export const getMarginHorizontal = (start: number, end?: number): { marginStart?: number; marginEnd?: number } => {
  return {
    marginStart: start,
    marginEnd: end ?? start,
  };
};

/**
 * Get padding values that respect RTL direction
 * Use paddingStart/paddingEnd instead of paddingLeft/paddingRight
 */
export const getPaddingHorizontal = (start: number, end?: number): { paddingStart?: number; paddingEnd?: number } => {
  return {
    paddingStart: start,
    paddingEnd: end ?? start,
  };
};

/**
 * Get position values that respect RTL direction
 * @param value The value for the logical start position (left in LTR, right in RTL)
 * @returns Object with the appropriate left/right property
 */
export const getPositionStart = (value: number): { [key: string]: number } => {
  return getIsRTL() ? { right: value } : { left: value };
};

/**
 * Get position values that respect RTL direction
 * @param value The value for the logical end position (right in LTR, left in RTL)
 * @returns Object with the appropriate right/left property
 */
export const getPositionEnd = (value: number): { [key: string]: number } => {
  return getIsRTL() ? { left: value } : { right: value };
};

/**
 * Transform a value (scaleX) for RTL reflection
 * @returns 1 for LTR, -1 for RTL to flip horizontally
 */
export const getRTLFlip = (): number => {
  return getIsRTL() ? -1 : 1;
};

/**
 * Create RTL-compatible style object
 */
export const createRTLStyle = (ltrStyle: ViewStyle | TextStyle, rtlStyle?: ViewStyle | TextStyle): ViewStyle | TextStyle => {
  if (getIsRTL() && rtlStyle) {
    return { ...ltrStyle, ...rtlStyle };
  }
  return ltrStyle;
};

/**
 * Get text direction property
 * @returns 'rtl' for Arabic, 'ltr' for English
 */
export const getTextDirection = (): 'ltr' | 'rtl' => {
  return getIsRTL() ? 'rtl' : 'ltr';
};

/**
 * Get writing direction for accessibility
 * @returns 'rtl' for Arabic, 'ltr' for English
 */
export const getWritingDirection = (): 'ltr' | 'rtl' => {
  return getIsRTL() ? 'rtl' : 'ltr';
};
