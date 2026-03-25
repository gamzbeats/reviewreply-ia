import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        error: NextResponse.json(
          {
            error: "VALIDATION_ERROR",
            details: err.flatten().fieldErrors,
          },
          { status: 400 }
        ),
      };
    }
    return {
      error: NextResponse.json(
        { error: "INVALID_JSON", details: "Request body must be valid JSON" },
        { status: 400 }
      ),
    };
  }
}
