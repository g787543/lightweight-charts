import { PricedValue } from '../model/price-scale';
import { CustomPriceLineOptions } from '../model/series-options';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';

import { LinePoint, LineStyle, LineType, LineWidth } from './draw-line';
import { ScaledRenderer } from './scaled-renderer';
import { walkLine } from './walk-line';

export type LineItem = TimedValue & PricedValue & LinePoint;

export interface PaneRendererLineData {
	lineType: LineType;
	yClose?: CustomPriceLineOptions;
	closeYCord: number | null;
	items: LineItem[];

	barWidth: number;

	lineColor: string;
	lineWidth: LineWidth;
	lineStyle: LineStyle;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererLine extends ScaledRenderer {
	protected _data: PaneRendererLineData | null = null;

	public setData(data: PaneRendererLineData): void {
		this._data = data;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}

		ctx.lineCap = 'butt';
		ctx.lineJoin = 'miter';

		ctx.beginPath();

		if (this._data.items.length === 1) {
			const point = this._data.items[0];
			ctx.moveTo(point.x - this._data.barWidth / 2, point.y);
			ctx.lineTo(point.x + this._data.barWidth / 2, point.y);
		} else {
			walkLine(
				ctx,
				this._data.items,
				{
					lineType: this._data.lineType,
					lineWidth: this._data.lineWidth,
					lineStyle: this._data.lineStyle,
					strokeStyle: this._data.lineColor,
				},
				this._data.visibleRange,
				this._data.closeYCord,
				this._data.yClose
			);
		}
	}
}
