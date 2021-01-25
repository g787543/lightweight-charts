/* eslint-disable complexity */
import { CustomPriceLineOptions } from '../model/series-options';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LinePoint, LineStyle, LineType, setLineStyle } from './draw-line';

interface LineOptions {
	lineType: LineType;
	lineWidth: number;
	lineStyle: LineStyle;
	strokeStyle: string;
}

function setLineOption(ctx: CanvasRenderingContext2D, lineOptions: LineOptions, coverLineColor: boolean): void {
	const {
		lineStyle,
		lineWidth,
		strokeStyle,
	} = lineOptions;
	ctx.lineWidth = lineWidth;
	setLineStyle(ctx, lineStyle);
	if (coverLineColor) {
		ctx.strokeStyle = strokeStyle;
	}
}

/**
 * BEWARE: The method must be called after beginPath and before stroke/fill/closePath/etc
 */
export function walkLine(
	ctx: CanvasRenderingContext2D,
	points: readonly LinePoint[],
	lineOptions: LineOptions,
	visibleRange: SeriesItemsIndexesRange,
	closeYCord: number | null,
	customStyle?: CustomPriceLineOptions
): void {
	if (points.length === 0) {
		return;
	}
	setLineOption(ctx, lineOptions, !customStyle?.price);
	ctx.moveTo(0, closeYCord as number);
	let topItem = points[0];
	for (let i = visibleRange.from; i < visibleRange.to; ++i) {
		const prevItem = points[i - 1];
		const currItem = points[i];
		if (prevItem && customStyle?.closeUpColor && customStyle?.closeDownColor && closeYCord) {
			const { closeUpColor, closeDownColor } = customStyle;
			if (prevItem.y <= closeYCord) {
				if (currItem.y > closeYCord) {
					const prevX = prevItem.x;
					const currX = currItem.x;
					const distance = (currX - prevX) / 2;
					ctx.strokeStyle = closeUpColor.color;
					ctx.lineTo(prevItem.x + distance, closeYCord);
					if (closeUpColor.topColor && closeUpColor.bottomColor) {
						ctx.closePath();
						const gradient = ctx.createLinearGradient(0, topItem.y, 0, closeYCord);
						gradient.addColorStop(0, closeUpColor.topColor);
						gradient.addColorStop(1, closeUpColor.bottomColor);
						ctx.fillStyle = gradient;
						ctx.fill();
					}
					ctx.stroke();

					ctx.beginPath();
					setLineOption(ctx, lineOptions, !customStyle?.price);
					ctx.strokeStyle = closeDownColor.color;
					ctx.moveTo(prevItem.x + distance, closeYCord);
					ctx.lineTo(currX, currItem.y);
					topItem = currItem;
				} else if (currItem.y <= closeYCord) {
					ctx.strokeStyle = closeUpColor.color;
					ctx.lineTo(currItem.x, currItem.y);
					if (topItem.y > currItem.y) {
						topItem = currItem;
					}
				}
			} else if (prevItem.y > closeYCord) {
				if (currItem.y < closeYCord) {
					const prevX = prevItem.x;
					const currX = currItem.x;
					const distance = (currX - prevX) / 2;
					ctx.strokeStyle = closeDownColor.color;
					ctx.lineTo(prevItem.x + distance, closeYCord);
					if (closeDownColor.topColor && closeDownColor.bottomColor) {
						ctx.closePath();
						const gradient = ctx.createLinearGradient(0, topItem.y, 0, closeYCord);
						gradient.addColorStop(0, closeDownColor.topColor);
						gradient.addColorStop(1, closeDownColor.bottomColor);
						ctx.fillStyle = gradient;
						ctx.fill();
					}
					ctx.stroke();

					ctx.beginPath();
					setLineOption(ctx, lineOptions, !customStyle?.price);
					ctx.strokeStyle = closeDownColor.color;
					ctx.moveTo(prevItem.x + distance, closeYCord);
					ctx.strokeStyle = closeUpColor.color;
					ctx.lineTo(currX, currItem.y);
					topItem = currItem;
				} else if (currItem.y >= closeYCord) {
					ctx.strokeStyle = closeDownColor.color;
					ctx.lineTo(currItem.x, currItem.y);
					if (topItem.y < currItem.y) {
						topItem = currItem;
					}
				}
			}
			if (i === visibleRange.to - 1) {
				ctx.lineTo(currItem.x, closeYCord);
				ctx.closePath();
				const gradient = ctx.createLinearGradient(0, topItem.y, 0, closeYCord);
				const color = topItem.y > closeYCord ? closeDownColor : closeUpColor;
				gradient.addColorStop(0, color.topColor as string);
				gradient.addColorStop(1, color.bottomColor as string);
				ctx.fillStyle = gradient;
				ctx.fill();
				ctx.stroke();
			}
		} else {
			ctx.lineTo(currItem.x, currItem.y);
		}
	}
}
