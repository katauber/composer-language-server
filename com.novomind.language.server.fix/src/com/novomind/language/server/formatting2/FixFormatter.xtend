/*
 * generated by Xtext 2.18.0
 */
package com.novomind.language.server.formatting2

import com.google.inject.Inject
import com.novomind.language.server.fix.Fix
import com.novomind.language.server.services.FixGrammarAccess
import org.eclipse.xtext.formatting2.AbstractFormatter2
import org.eclipse.xtext.formatting2.IFormattableDocument

class FixFormatter extends AbstractFormatter2 {
	
	@Inject extension FixGrammarAccess

	def dispatch void format(Fix fix, extension IFormattableDocument document) {
		// TODO: format HiddenRegions around keywords, attributes, cross references, etc. 
		for (element : fix.elements) {
			element.format
		}
	}
	
	// TODO: implement for 
}
