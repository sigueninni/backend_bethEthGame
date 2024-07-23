import { ApiProperty } from "@nestjs/swagger";

export class BuyTokenDto {
    @ApiProperty({ type: String, required: true, default: 0 })
    amount: string;
}