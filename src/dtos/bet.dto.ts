import { ApiProperty } from "@nestjs/swagger";

export class BetDto {
    @ApiProperty({ type: String, required: true, default: 0 })
    prediction: string;
}