export function GET(request:Request){
  return Response.redirect(new URL('/apple-icon',request.url),307);
}