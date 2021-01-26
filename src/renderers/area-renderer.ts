import { Coordinate } from '../model/coordinate';
import { CustomPriceLineOptions } from '../model/series-options';
import { SeriesItemsIndexesRange } from '../model/time-data';

import { LineStyle, LineType, LineWidth } from './draw-line';
import { LineItem } from './line-renderer';
import { ScaledRenderer } from './scaled-renderer';
import { walkLine } from './walk-line';

export interface PaneRendererAreaData {
	yClose?: CustomPriceLineOptions;
	closeYCord: number | null;
	items: LineItem[];
	lineType: LineType;
	lineColor: string;
	lineWidth: LineWidth;
	lineStyle: LineStyle;

	topColor: string;
	bottomColor: string;
	bottom: Coordinate;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererArea extends ScaledRenderer {
	protected _data: PaneRendererAreaData | null = null;

	public setData(data: PaneRendererAreaData): void {
		this._data = data;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.items.length === 0 || this._data.visibleRange === null) {
			return;
		}

		ctx.lineCap = 'butt';
		ctx.lineJoin = 'miter';
		// walk lines with width=1 to have more accurate gradient's filling
		ctx.beginPath();

		if (this._data.items.length === 1) {
			const point = this._data.items[0];
			const halfBarWidth = this._data.barWidth / 2;
			ctx.moveTo(point.x - halfBarWidth, this._data.bottom);
			ctx.lineTo(point.x - halfBarWidth, point.y);
			ctx.lineTo(point.x + halfBarWidth, point.y);
			ctx.lineTo(point.x + halfBarWidth, this._data.bottom);
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

			if (this._data.visibleRange.to > this._data.visibleRange.from && !this._data.yClose) {
				ctx.lineTo(this._data.items[this._data.visibleRange.to - 1].x, this._data.bottom);
				ctx.lineTo(this._data.items[this._data.visibleRange.from].x, this._data.bottom);
			}
		}
		if (!this._data.yClose) {
			ctx.closePath();

			const gradient = ctx.createLinearGradient(0, 0, 0, this._data.bottom);
			gradient.addColorStop(0, this._data.topColor);
			gradient.addColorStop(1, this._data.bottomColor);

			ctx.fillStyle = gradient;
			ctx.fill();
		}
	}
}
