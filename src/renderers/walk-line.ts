/* eslint-disable complexity */
import { Coordinate } from '../model/coordinate';
import { CustomPriceLineOptions, GradientColor } from '../model/series-options';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LinePoint, LineStyle, LineType, setLineStyle } from './draw-line';

interface LineOptions {
	lineType: LineType;
	lineWidth: number;
	lineStyle: LineStyle;
	strokeStyle: string;
}

interface GradientPosition {
	x: number;
	y: number;
	x1: number;
	y1: number;
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

function setGradientColor(
	ctx: CanvasRenderingContext2D,
	position: GradientPosition,
	gradient: GradientColor
): void {
	if (gradient.topColor && gradient.bottomColor) {
		const g = ctx.createLinearGradient(position.x, position.y, position.x1, position.y1);
		g.addColorStop(0, gradient.topColor);
		g.addColorStop(1, gradient.bottomColor);
		ctx.fillStyle = g;
		ctx.fill();
	}
}

function getPoint(
	prevItem: LinePoint,
	currItem: LinePoint,
	closeYCord: number
): LinePoint {
	const { x: x1, y: y1 } = prevItem;
	const { x: x2, y: y2 } = currItem;
	return {
		x: (closeYCord - y1) / (y2 - y1) * (x2 - x1) + x1 as Coordinate,
		y: closeYCord as Coordinate,
	};
}

// eslint-disable-next-line max-params
function createNewArea(
	ctx: CanvasRenderingContext2D,
	lineOptions: LineOptions,
	customStyle: CustomPriceLineOptions,
	gradient: GradientColor,
	closeYCord: number,
	prevItem: LinePoint,
	currItem: LinePoint
): void {
	const centerPoint = getPoint(prevItem, currItem, closeYCord);
	ctx.beginPath();
	setLineOption(ctx, lineOptions, !customStyle?.price);
	ctx.strokeStyle = gradient.color;
	ctx.moveTo(centerPoint.x, centerPoint.y);
	ctx.lineTo(currItem.x, currItem.y);
}

function endArea(
	ctx: CanvasRenderingContext2D,
	gradient: GradientColor,
	closeYCord: number,
	prevItem: LinePoint,
	currItem: LinePoint,
	topItem: LinePoint
): LinePoint {
	const centerPoint = getPoint(prevItem, currItem, closeYCord);
	ctx.strokeStyle = gradient.color;
	ctx.lineTo(centerPoint.x, closeYCord);
	setGradientColor(ctx, { x: 0, y: topItem.y, x1: 0, y1: closeYCord }, gradient);
	ctx.stroke();
	return centerPoint;
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
	const dataArr = [];
	let topItem = points[0];
	let downItem = points[0];
	ctx.moveTo(topItem.x, closeYCord || topItem.y);
	let judge;
	for (let i = visibleRange.from; i < visibleRange.to; ++i) {
		const prevItem = points[i - 1];
		const currItem = points[i];
		if (prevItem && customStyle?.closeUpColor && customStyle?.closeDownColor && closeYCord) {
			const { closeUpColor, closeDownColor } = customStyle;
			if (prevItem.y <= closeYCord) {
				if (currItem.y > closeYCord) {
					const endPoint = endArea(ctx, closeUpColor, closeYCord, prevItem, currItem, topItem);
					dataArr.length = 0;
					createNewArea(ctx, lineOptions, customStyle, closeDownColor, closeYCord, prevItem, currItem);
					dataArr.push(endPoint, currItem);
				} else if (currItem.y <= closeYCord) {
					ctx.strokeStyle = closeUpColor.color;
					ctx.lineTo(currItem.x, currItem.y);
					if (topItem.y > currItem.y) {
						topItem = currItem;
					}
					dataArr.push(currItem);
					judge = 'up';
				}
			} else if (prevItem.y > closeYCord) {
				if (currItem.y <= closeYCord) {
					const endPoint = endArea(ctx, closeDownColor, closeYCord, prevItem, currItem, downItem);
					dataArr.length = 0;
					createNewArea(ctx, lineOptions, customStyle, closeUpColor, closeYCord, prevItem, currItem);
					dataArr.push(endPoint, currItem);
				} else if (currItem.y > closeYCord) {
					ctx.strokeStyle = closeDownColor.color;
					ctx.lineTo(currItem.x, currItem.y);
					if (downItem.y < currItem.y) {
						downItem = currItem;
					}
					dataArr.push(currItem);
					judge = 'down';
				}
			}
			if (i === visibleRange.to - 1) {
				ctx.fillStyle = 'rgba(0,0,0,0)';
				ctx.fill();
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(dataArr[0].x, closeYCord);
				ctx.strokeStyle = 'rgba(0,0,0,0)';
				for (let j = 0; j < dataArr.length; j ++) {
					const item = dataArr[j];
					ctx.lineTo(item.x, item.y);
					if (j === dataArr.length - 1) {
						ctx.lineTo(item.x, closeYCord);
					}
				}
				const color = judge === 'up' ? customStyle.closeUpColor : customStyle.closeDownColor;
				setGradientColor(ctx, { x: 0, y: judge === 'up' ? topItem.y : downItem.y, x1: 0, y1: closeYCord }, color);
			}
		} else {
			ctx.lineTo(currItem.x, currItem.y);
			if (currItem.y > topItem.y) {
				topItem = currItem;
			}
		}
	}
	ctx.stroke();
}
