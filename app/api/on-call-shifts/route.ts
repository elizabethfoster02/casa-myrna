import type { NextApiRequest, NextApiResponse } from 'next'
import { type NextRequest } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { start } from 'repl'
const prisma = new PrismaClient()


/* 
 * GETs a on-call shift from the database
 * A userID, status, and/or after/before times can be provided as query params 
 * to filter results
 */
export async function GET(req: NextRequest)
{
        try {
                const searchParams = req.nextUrl.searchParams
                const userID = searchParams.get('userID')
                const userID_numeric = userID ? parseInt(userID as string, 10): null;
                
                const startBound = searchParams.get('after')  
                const endBound = searchParams.get('before')
                const startBoundDate = startBound ? new Date(startBound): null
                const endBoundDate = endBound ? new Date(endBound): null

                if (isNaN(userID_numeric as number)) {
                        return new Response('Error: Please specify an integer userID id', {
                                status: 400,
                        })
                } else if ((startBoundDate && isNaN(startBoundDate.getTime())) || 
                           (endBoundDate && isNaN(endBoundDate.getTime()))) {
                        return new Response('Error: after & before fields must be valid dates', {
                                status: 400,
                        })
                }
                let queryFilters  = {
                        AND: [{}]
                }
                if (userID_numeric){
                        queryFilters.AND.push({ userID: userID_numeric})
                }
                if (startBound){
                        queryFilters.AND.push({from : {gte: startBoundDate,}})
                }
                if (endBound) {
                        queryFilters.AND.push({to : {lte: endBoundDate,}})
                }

                let shifts = await prisma.onCallShift.findMany({where: queryFilters})
                return new Response(JSON.stringify(shifts))
        } catch {
                return new Response('Error: An unexpected error occured', {
                        status: 500,
                      })
        }
}

/* 
 * Inserts a new on-call shift into the database
 * Expects the request body to be json with fields corresponding to the fields 
 * of the onCallShift model
 */
export async function POST(req: Request) {
    try {
      let data = await req.json();
      if (!('userID' in data && 'date' in data && 'from' in data && 'to' in data 
            && 'message' in data && 'phoneLine' in data)){
          return new Response('Error: Missing required field', {
            status: 404,
        })
    } 
        data = {
                ...data,
                "date": new Date(data.date),
                "from": new Date(data.from),
                "to": new Date(data.to),
                "created_at": new Date()
        };
        const shift = await prisma.onCallShift.create({data});
        return new Response(JSON.stringify(shift))
    } catch (error){
        return new Response('Error: An unexpected error occured', {status: 500,})
      }
    }

/* 
 * Upserts an on-call shift into the database
 * Expects the request body to be json with fields corresponding to the fields 
 * of the onCallShift model. Also requires a shiftID as a query param
 */
export async function PUT(req: NextRequest) {
        try {
                const searchParams = req.nextUrl.searchParams
                let idString = searchParams.get('shiftID')
                let idNum = parseInt(idString as string, 10) // 10 = base 10 
      
                if ((isNaN(idNum))) {
                return new Response('Error: Please specify an integer shift id', {
                status: 400,
                })
                }
                let data = await req.json();
                if (!('userID' in data && 'date' in data && 'from' in data && 'to' in data 
                && 'message' in data && 'phoneLine' in data)){
                        return new Response('Error: Missing required field', {
                        status: 404,
                })
        } 
        data = {
                ...data,
                "onCallShiftID": idNum,
                "date": new Date(data.date),
                "from": new Date(data.from),
                "to": new Date(data.to),
                "created_at": new Date()
        };

        const shift = await prisma.onCallShift.upsert({
                where: {onCallShiftID: idNum},
                update: data,
                create: data
        })
                return new Response(JSON.stringify(shift))
        } catch (error){
                return new Response('Error: An unexpected error occured', {status: 500,})
          }
        }

/* 
 * DELETEs a back up shift from the database
 * Expects an integer shiftID to be provided as a query parameter 
 */
export async function DELETE(req: NextRequest) {
        try {
                const searchParams = req.nextUrl.searchParams
                let idString = searchParams.get('shiftID')
                let idNum = parseInt(idString as string, 10) // 10 = base 10 
      
                if ((isNaN(idNum))) {
                        return new Response('Error: Please specify an integer shift id', {
                                status: 400,
                        })
                }
          let shift = await prisma.onCallShift.delete({
                where: {
                        onCallShiftID: idNum,
                },
          })
          return Response.json(shift)
       } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && 
                    error.code === 'P2025') {
                        return new Response('Error: Shift not found', {
                                status: 400,
                        })
                } else {
                        return new Response('Error: An unexpected error occured', {status: 500,})
                }
          }   
}